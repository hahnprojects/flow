import type { AmqpConnectionManager, Channel, ChannelWrapper } from 'amqp-connection-manager';
import type { ConsumeMessage } from 'amqplib';
import { randomUUID } from 'crypto';
import sizeof from 'object-sizeof';

import { FlowLogger } from './FlowLogger';

const MAX_MSG_SIZE = +process.env.MAX_RPC_MSG_SIZE_BYTES;
const WARN_MSG_SIZE = +process.env.WARN_RPC_MSG_SIZE_BYTES;

export class RpcClient {
  private readonly channel: ChannelWrapper;
  private openRequests: Map<string, { resolve; reject; trace: string }> = new Map<string, { resolve; reject; trace: string }>();

  constructor(
    amqpConnection: AmqpConnectionManager,
    private readonly logger?: FlowLogger,
  ) {
    if (!amqpConnection) {
      throw new Error('currently no amqp connection available');
    }
    this.channel = amqpConnection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await channel.assertExchange('rpc_direct_exchange', 'direct', { durable: false });
        await channel.consume('amq.rabbitmq.reply-to', this.onMessage, { noAck: true });
      },
    });
  }

  private onMessage = (msg: ConsumeMessage) => {
    if (this.openRequests.has(msg.properties.correlationId)) {
      const { resolve, reject, trace } = this.openRequests.get(msg.properties.correlationId);
      const response = JSON.parse(msg.content.toString());
      switch (response.type) {
        case 'reply':
          resolve(response.value);
          break;
        case 'error': {
          const err = new Error(response.message);
          if (response.stack) {
            const stack: string = RpcClient.formatTrace(response.stack);
            err.stack = 'Remote Stack\n'.concat(stack, '\nLocal Stack\n', trace);
          } else {
            err.stack = trace;
          }
          reject(err);
          break;
        }
        default:
          reject(response);
          break;
      }
    } else {
      const message = `received unexpected response correlationID: ${msg.properties.correlationId}`;
      /* eslint-disable-next-line no-console */
      console.warn(message);
    }
  };

  public callFunction = (routingKey: string, functionName: string, ...args: any[]) => {
    // in case remote returns error add this to the trace
    const stack = new Error('test').stack;
    return new Promise((resolve, reject) => {
      // save to correlationId-> resolve/reject map
      // on return resolve or reject promise

      if (MAX_MSG_SIZE || WARN_MSG_SIZE) {
        const messageSize = sizeof(args);
        if (messageSize > MAX_MSG_SIZE) {
          throw new Error(`Max RPC message size exceeded: ${messageSize} bytes / ${MAX_MSG_SIZE} bytes`);
        }
        if (messageSize > WARN_MSG_SIZE) {
          this.logger?.warn(`Large RPC message size detected: ${messageSize} bytes`);
        }
      }

      const call = { functionName, arguments: args };
      const correlationId = randomUUID();
      this.openRequests.set(correlationId, { resolve, reject, trace: RpcClient.formatTrace(stack) });
      this.channel
        .publish('rpc_direct_exchange', routingKey, call, { correlationId, replyTo: 'amq.rabbitmq.reply-to' })
        .catch((err) => reject(err));
    });
  };

  public declareFunction = (routingKey: string, name: string) => {
    return (...args) => this.callFunction(routingKey, name, ...args);
  };

  public close() {
    return this.channel.close();
  }

  public static formatTrace(stack = '') {
    return stack.split('\n').splice(1).join('\n');
  }
}
