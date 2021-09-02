import { Worker } from 'worker_threads';
import { join } from 'path';
import { Options, Replies } from 'amqplib/properties';
import * as amqplib from 'amqplib';
import { ConsumeMessage } from 'amqplib';
import { MessageHandlerOptions } from '@golevelup/nestjs-rabbitmq/lib/rabbitmq.interfaces';
import { v4 } from 'uuid';

import { AMQPConnectionOptions } from './flow.interface';
import { Nack } from './amqp';
import AssertExchange = Replies.AssertExchange;

export class AsyncConnection {
  private worker: Worker;
  private openRequests: Map<string, { resolve; reject }> = new Map<string, { resolve; reject }>();
  private subscriptions: Map<string, (msg: unknown | undefined, rawMessage?: amqplib.ConsumeMessage) => Promise<Nack | undefined>> =
    new Map<string, (msg: unknown | undefined, rawMessage?: amqplib.ConsumeMessage) => Promise<Nack | undefined>>();
  private rpcChannels: Map<string, (msg: amqplib.ConsumeMessage) => void> = new Map<string, (msg: ConsumeMessage) => void>();

  constructor() {}

  public async init(amqpConnectionOptions?: AMQPConnectionOptions) {
    return new Promise((resolve, reject) => {
      const id = v4();
      this.openRequests.set(id, { resolve, reject });
      this.worker = new Worker(join(__dirname, 'worker.js'), {
        workerData: {
          path: join(__dirname, 'worker.ts'),
          amqpConnectionOptions,
          id,
        },
      });
      this.worker.on('message', (msg) => this.handleMessage(msg));
    });
  }

  public publish(
    exchange: string,
    routingKey: string,
    message: any,
    options: amqplib.Options.Publish & { channelId?: string } = {},
  ): Promise<void> {
    return new Promise<any>((resolve, reject) => {
      const id = v4();
      this.openRequests.set(id, { resolve, reject });
      const data: WorkerMessage = {
        type: 'publish',
        data: {
          exchange,
          routingKey,
          message,
          options,
        },
        id,
      };
      this.worker.postMessage(data);
    });
  }

  public subscribe<T>(
    handler: (msg: T | undefined, rawMessage?: amqplib.ConsumeMessage) => Promise<Nack | undefined>,
    msgOptions: MessageHandlerOptions,
  ): Promise<void> {
    // wrap handler in NACK detector
    // send nack or void to worker upon return
    // worker handler can only return after return of message
    // save handler with id in subscriptions
    const id = v4();
    this.subscriptions.set(id, handler);

    // send subscribe
    return new Promise<any>((resolve, reject) => {
      this.openRequests.set(id, { resolve, reject });
      const data: WorkerMessage = {
        type: 'subscribe',
        data: msgOptions,
        id,
      };
      this.worker.postMessage(data);
    });
  }

  public assertExchange(
    exchange: string,
    type: 'direct' | 'topic' | 'headers' | 'fanout' | 'match' | string,
    options?: Options.AssertExchange,
  ): Promise<Replies.AssertExchange> {
    return new Promise<Replies.AssertExchange>((resolve, reject) => {
      const id = v4();
      this.openRequests.set(id, { resolve, reject });
      const data: WorkerMessage = {
        type: 'assertExchange',
        data: {
          exchange,
          type,
          options,
        },
        id,
      };
      this.worker.postMessage(data);
    });
  }

  public startRpcChannel(exchange: string, handler: (msg: ConsumeMessage) => void, channelId: string): Promise<void> {
    const id = v4();
    this.rpcChannels.set(id, handler);
    return new Promise<void>((resolve, reject) => {
      this.openRequests.set(id, { resolve, reject });
      const data: WorkerMessage = {
        type: 'startRpc',
        data: {
          exchange,
          channelId,
        },
        id,
      };
      this.worker.postMessage(data);
    });
  }

  public async destroy() {
    return this.worker.terminate();
  }

  private async handleMessage(msg: WorkerReturnMessage) {
    const req = this.openRequests.get(msg.id);
    switch (msg.type) {
      case 'initialized':
        req.resolve();
        break;
      case 'publish':
        (msg as WorkerErrorMessage).error ? req.reject((msg as WorkerErrorMessage).error) : req.resolve();
        break;
      case 'assertExchange':
        (msg as WorkerErrorMessage).error
          ? req.reject((msg as WorkerErrorMessage).error)
          : req.resolve((msg as WorkerAssertExchangeResponse).exchange);
        break;
      case 'general':
        req.reject((msg as WorkerErrorMessage).error);
        break;
      case 'subscribe':
        // error case also remove subscription
        (msg as WorkerErrorMessage).error ? req.reject((msg as WorkerErrorMessage).error) : req.resolve();
        break;
      case 'subscribedMessage':
        // message received from broker
        // send to handler
        await this.handleSubscribeMessage(msg as WorkerSubscribedMessage);
        break;
      case 'startRpc':
        (msg as WorkerErrorMessage).error ? req.reject((msg as WorkerErrorMessage).error) : req.resolve();
        break;
      case 'rpcResponse':
        await this.handleRpcResponse(msg as WorkerRpcResponse);
        break;
    }
  }

  private async handleSubscribeMessage(subMsg: WorkerSubscribedMessage) {
    const sub = this.subscriptions.get(subMsg.subId);
    const nack = await sub(subMsg.msg, subMsg.rawMessage);
    const res: WorkerSubscribeResponse = { nack: nack instanceof Nack, requeue: nack?.requeue || false };
    this.worker.postMessage({
      type: 'subscribeResponse',
      id: subMsg.id,
      data: res,
    });
  }

  private async handleRpcResponse(msg: WorkerRpcResponse) {
    const channel = this.rpcChannels.get(msg.id);
    channel(msg.msg);
  }
}

export interface WorkerAssertExchangeMessage {
  exchange: string;
  type: 'direct' | 'topic' | 'headers' | 'fanout' | 'match' | string;
  options?: Options.AssertExchange;
}

export interface WorkerRpcMessage {
  exchange: string;
  channelId?: string;
}

export interface WorkerMessage {
  type: 'publish' | 'subscribe' | 'assertExchange' | 'subscribeResponse' | 'startRpc';
  id: string;
  data: WorkerPublishMessage | MessageHandlerOptions | WorkerAssertExchangeMessage | WorkerSubscribeResponse | WorkerRpcMessage;
}

export interface WorkerPublishMessage {
  exchange: string;
  routingKey: string;
  message: any;
  options: amqplib.Options.Publish & { channelId?: string };
}

export interface WorkerSubscribeResponse {
  nack: boolean;
  requeue: boolean;
}

export interface WorkerReturnMessage {
  id: string;
  type: 'initialized' | 'publish' | 'assertExchange' | 'general' | 'subscribe' | 'subscribedMessage' | 'startRpc' | 'rpcResponse';
}

export interface WorkerErrorMessage extends WorkerReturnMessage {
  error: any;
}

export interface WorkerAssertExchangeResponse extends WorkerReturnMessage {
  exchange: AssertExchange;
}

export interface WorkerSubscribedMessage extends WorkerReturnMessage {
  msg: unknown;
  rawMessage?: ConsumeMessage;
  subId: string;
}

export interface WorkerRpcResponse extends WorkerReturnMessage {
  msg: ConsumeMessage;
}
