import { parentPort } from 'worker_threads';
import { AmqpConnection, Nack } from '@golevelup/nestjs-rabbitmq';
import {
  WorkerAssertExchangeMessage,
  WorkerAssertExchangeResponse,
  WorkerErrorMessage,
  WorkerMessage,
  WorkerPublishMessage,
  WorkerReturnMessage,
  WorkerRpcMessage,
  WorkerRpcResponse,
  WorkerSubscribedMessage,
  WorkerSubscribeResponse,
} from './AsyncConnection';
import { Channel, ConsumeMessage, Replies } from 'amqplib';
import { MessageHandlerOptions } from '@golevelup/nestjs-rabbitmq/lib/rabbitmq.interfaces';
import { v4 } from 'uuid';
import { ChannelWrapper } from 'amqp-connection-manager';
import AssertExchange = Replies.AssertExchange;

const { workerData } = require('worker_threads');

const { username, password, hostname, port } = workerData.amqpConnectionOptions;
const connection = new AmqpConnection({
  uri: `amqp://${username}:${password}@${hostname}:${port}`,
  connectionManagerOptions: { reconnectTimeInSeconds: 0.5 },
});
connection.init().then(() => parentPort.postMessage({ id: workerData.id, type: 'initialized' }));

const openRequests: Map<string, { resolve; reject }> = new Map<string, { resolve; reject }>();
const channels: Map<string, Channel> = new Map<string, Channel>();
const channelWrappers: Map<string, ChannelWrapper> = new Map<string, ChannelWrapper>();

parentPort.on('message', async (data: WorkerMessage) => {
  const msg = data.data;
  switch (data.type) {
    case 'publish':
      await handlePublishMessage(data, msg as WorkerPublishMessage);
      break;
    case 'subscribe':
      await handleSubscribeMessage(data, msg as MessageHandlerOptions);
      break;
    case 'assertExchange':
      await handleAssertExchangeMessage(data, msg as WorkerAssertExchangeMessage);
      break;
    case 'subscribeResponse':
      // eslint-disable-next-line no-case-declarations
      const res = openRequests.get(data.id);
      (data.data as WorkerSubscribeResponse).nack ? res.reject((data.data as WorkerSubscribeResponse).requeue) : res.resolve();
      break;
    case 'startRpc':
      await startRpcChannel(data, msg as WorkerRpcMessage);
      break;
  }
});

async function handlePublishMessage(data: WorkerMessage, msg: WorkerPublishMessage) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const channel = msg.options?.channelId ? channels.get(msg.options.channelId) : connection.channel;
      const channelWrapper = msg.options?.channelId ? channelWrappers.get(msg.options.channelId) : connection.managedChannel;
      await channel.checkExchange(msg.exchange);
      msg.options.contentType = 'application/json';
      channelWrapper.publish(msg.exchange, msg.routingKey, Buffer.from(JSON.stringify(msg.message)), msg.options).then(
        () => {
          const message: WorkerReturnMessage = { id: data.id, type: 'publish' };
          parentPort.postMessage(message);
          resolve();
        },
        (error) => {
          const message: WorkerErrorMessage = { id: data.id, error, type: 'publish' };
          parentPort.postMessage(message);
          reject();
        },
      );
    } catch (error) {
      await connection.managedChannel.waitForConnect();
      const message: WorkerErrorMessage = { id: data.id, error, type: 'publish' };
      parentPort.postMessage(message);
      reject();
    }
  });
}

async function handleAssertExchangeMessage(data: WorkerMessage, msg: WorkerAssertExchangeMessage) {
  return new Promise<void>((resolve, reject) => {
    connection.channel.assertExchange(msg.exchange, msg.type, msg.options).then(
      (exchange: AssertExchange) => {
        const message: WorkerAssertExchangeResponse = { id: data.id, type: 'assertExchange', exchange };
        parentPort.postMessage(message);
        resolve();
      },
      async (error) => {
        const message: WorkerErrorMessage = { id: data.id, error, type: 'assertExchange' };
        await connection.managedChannel.waitForConnect();
        parentPort.postMessage(message);
        reject();
      },
    );
  });
}

async function handleSubscribeMessage(data: WorkerMessage, opts: MessageHandlerOptions) {
  // todo error handler
  return new Promise<void>(async (resolve, reject) => {
    try {
      if (opts.exchange) await connection.channel.checkExchange(opts.exchange);
      if (opts.queue) await connection.channel.assertQueue(opts.queue);

      await connection.createSubscriber(async (msg, rawMessage) => {
        try {
          await sendSubscribeMessage(msg, data.id, rawMessage);
          return;
        } catch (e) {
          // NACK was sent
          // reject with requeue option
          return new Nack(Boolean(e));
        }
      }, opts);
      const message: WorkerReturnMessage = { id: data.id, type: 'subscribe' };
      parentPort.postMessage(message);
    } catch (error) {
      await connection.managedChannel.waitForConnect();
      const message: WorkerErrorMessage = { id: data.id, error, type: 'subscribe' };
      parentPort.postMessage(message);
      reject();
    }
  });
}

async function sendSubscribeMessage(msg: unknown, subId: string, rawMessage?: ConsumeMessage) {
  return new Promise<void>(async (resolve, reject) => {
    const id = v4();
    openRequests.set(id, { resolve, reject });
    const message: WorkerSubscribedMessage = { id, type: 'subscribedMessage', msg, rawMessage, subId };
    parentPort.postMessage(message);
  });
}

async function startRpcChannel(data: WorkerMessage, msg: WorkerRpcMessage) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const channelWrapper = connection.managedConnection.createChannel({
        json: true,
        setup: async (channel: Channel) => {
          await channel.assertExchange(msg.exchange, 'direct', { durable: false });
          await channel.consume(
            'amq.rabbitmq.reply-to',
            (msg) => {
              const rpcResponse: WorkerRpcResponse = {
                msg,
                type: 'rpcResponse',
                id: data.id,
              };
              parentPort.postMessage(rpcResponse);
            },
            { noAck: true },
          );
          channels.set(msg.channelId, channel);
          const message: WorkerReturnMessage = { id: data.id, type: 'startRpc' };
          parentPort.postMessage(message);
          resolve();
        },
      });
      channelWrappers.set(msg.channelId, channelWrapper);
    } catch (error) {
      await connection.managedChannel.waitForConnect();
      const message: WorkerErrorMessage = { id: data.id, error, type: 'startRpc' };
      parentPort.postMessage(message);
      reject();
    }
  });
}
