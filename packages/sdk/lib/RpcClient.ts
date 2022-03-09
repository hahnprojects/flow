import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';
import { v4 as uuid } from 'uuid';

export class RpcClient {
  private channel: ChannelWrapper;
  private openRequests: Map<string, { resolve; reject; trace: string }> = new Map<string, { resolve; reject; trace: string }>();

  constructor(private connection: AmqpConnectionManager) {
    if (!connection) {
      throw new Error('currently no amqp connection available');
    }
  }

  public async init() {
    this.channel = this.connection.createChannel({
      json: true,
      setup: (channel: Channel) =>
        Promise.all([
          channel.assertExchange('rpc_direct_exchange', 'direct', { durable: false }),
          channel.consume('amq.rabbitmq.reply-to', this.onMessage, { noAck: true }),
        ]),
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
      const call = { functionName, arguments: args };
      const correlationId = uuid();
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
