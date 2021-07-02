import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { Channel, Connection, ConsumeMessage, Options } from 'amqplib';

export interface AmqpConnection {
  channel: Channel;
  connection: Connection;
  managedChannel: ChannelWrapper;
  managedConnection: AmqpConnectionManager;
  createSubscriber<T>(
    handler: (msg: T | undefined, rawMessage?: ConsumeMessage) => Promise<Nack | undefined>,
    msgOptions: MessageHandlerOptions,
  ): Promise<void>;
  publish(exchange: string, routingKey: string, message: any, options?: Options.Publish): Promise<void>;
}

export declare class Nack {
  private readonly _requeue;
  constructor(_requeue?: boolean);
  get requeue(): boolean;
}

export interface MessageHandlerOptions {
  exchange: string;
  routingKey: string | string[];
  queue?: string;
  queueOptions?: QueueOptions;
}

export interface QueueOptions {
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  arguments?: any;
  messageTtl?: number;
  expires?: number;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
  maxLength?: number;
  maxPriority?: number;
}
