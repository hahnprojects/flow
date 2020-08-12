import { Channel, Connection, ConsumeMessage, connect } from 'amqplib';

export const remoteProcedures: Map<string, Function> = new Map<string, Function>();

export class RPCServer {
  private static instances: Map<string, RPCServer> = new Map<string, RPCServer>();
  private channel: Channel;
  private connection: Connection;

  constructor(private routingKey: string) {}

  public static async getInstance(routingKey: string, connection?: Connection) {
    if (this.instances.has(routingKey)) {
      return this.instances.get(routingKey);
    } else {
      // make new Instance
      const instance = new RPCServer(routingKey);
      this.instances.set(routingKey, instance);
      await instance.init(connection);
      return instance;
    }
  }

  private async init(connection: Connection) {
    if (!connection) {
      // not given connection -> connect to broker
      const url = process.env.RPC_URL || 'amqp://localhost';
      this.connection = await connect(url);
    }
    this.channel = await this.connection.createChannel();

    const exchange = await this.channel.assertExchange('rpc_direct_exchange', 'direct', { durable: false });

    // queue
    const queue = await this.channel.assertQueue('', { exclusive: true });
    await this.channel.bindQueue(queue.queue, exchange.exchange, this.routingKey);

    // start consuming remote procedure calls
    await this.channel.prefetch(1);
    await this.channel.consume(queue.queue, (msg) => this.handleMessage(msg));
  }

  private handleMessage(msg: ConsumeMessage) {
    const request = JSON.parse(msg.content.toString());
    let reply;
    // call function
    try {
      if (remoteProcedures.has(request.functionName)) {
        const func = remoteProcedures.get(request.functionName);
        const returnValue = func(...request.arguments);
        reply = { type: 'reply', value: returnValue };
      } else {
        // if function does not exist send error
        reply = { type: 'error', message: `${request.functionName} is not a function` };
      }
    } catch (e) {
      // if function throws error, send it
      reply = { type: 'error', message: e.message, stack: e.stack };
    } finally {
      // send reply
      this.channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(reply)), {
        correlationId: msg.properties.correlationId,
      });

      this.channel.ack(msg);
    }
  }

  public async close() {
    await this.channel.close();
    await this.connection.close();
  }
}
