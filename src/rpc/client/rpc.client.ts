import { Channel, Connection, ConsumeMessage, connect } from 'amqplib';
import { v4 as uuid } from 'uuid';
import { FlowLogger, defaultLogger } from '../../FlowLogger';

export class RPCClient {
  private static instances: Map<string, RPCClient> = new Map<string, RPCClient>();

  private logger: FlowLogger;

  private channel: Channel;
  private connection: Connection;
  private openRequests: Map<string, { resolve; reject; trace: string }> = new Map<string, { resolve; reject; trace: string }>();

  constructor(private routingKey: string) {}

  public static async getInstance(routingKey: string, connection?: Connection) {
    if (this.instances.has(routingKey)) {
      return this.instances.get(routingKey);
    } else {
      // make new Instance
      const instance = new RPCClient(routingKey);
      this.instances.set(routingKey, instance);
      await instance.init(connection);
      return instance;
    }
  }

  private async init(connection: Connection) {
    if (!connection) {
      // connect to broker
      const url = process.env.RPC_URL || 'amqp://localhost';
      this.connection = await connect(url);
    } else {
      this.connection = connection;
    }
    this.channel = await this.connection.createChannel();

    await this.channel.assertExchange('rpc_direct_exchange', 'direct', { durable: false });

    // start consuming callbacks
    await this.channel.consume('amq.rabbitmq.reply-to', (msg) => this.handleResponse(msg), { noAck: true });
  }

  private handleResponse(msg: ConsumeMessage) {
    if (this.openRequests.has(msg.properties.correlationId)) {
      const { resolve, reject, trace } = this.openRequests.get(msg.properties.correlationId);
      const response = JSON.parse(msg.content.toString());
      switch (response.type) {
        case 'reply':
          resolve(response.value);
          break;
        case 'error':
          const err = new Error(response.message);
          if (response.stack) {
            const stack: string = RPCClient.getTrace(response.stack || '');
            err.stack = 'Remote Stack\n'.concat(stack, '\nLocal Stack\n', trace);
          } else {
            err.stack = trace;
          }
          reject(err);
          break;
        default:
          reject(response);
          break;
      }
    } else {
      const message = `received unexpected response correlationID: ${msg.properties.correlationId}`;
      if (this.logger) {
        this.logger.warn(message);
      } else {
        defaultLogger.warn(message);
      }
    }
  }

  private static getTrace(stack: string) {
    return stack.split('\n').splice(1).join('\n');
  }

  public async callFunction(functionName: string, ...args: any[]) {
    // in case remote returns error add this to the trace
    const stack = new Error('test').stack;
    return new Promise((resolve, reject) => {
      // save to correlationId-> resolve/reject map
      // on return resolve or reject promise
      const call = { functionName, arguments: args };
      const correlationId = uuid();
      this.openRequests.set(correlationId, { resolve, reject, trace: RPCClient.getTrace(stack) });
      this.channel.publish('rpc_direct_exchange', this.routingKey, Buffer.from(JSON.stringify(call)), {
        correlationId,
        replyTo: 'amq.rabbitmq.reply-to',
      });
    });
  }

  public async close() {
    await this.channel.close();
    await this.connection.close();
  }

  public declareFunction(name: string) {
    return (...args) => this.callFunction(name, ...args);
  }

  public setLogger(logger: FlowLogger) {
    this.logger = logger;
  }
}
