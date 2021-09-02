import { AsyncConnection } from '../lib/AsyncConnection';
import { defaultAMQPConnectionOptions } from '../lib';
import { Nack } from '../lib/amqp';

describe('Async Connection', () => {
  let asyncCon: AsyncConnection;

  beforeEach(async () => {
    asyncCon = new AsyncConnection();
    await asyncCon.init(defaultAMQPConnectionOptions);
  });

  test('publish', async () => {
    await expect(asyncCon.publish('qrbuq', 'rqbq', { foo: 'bar' })).rejects.toEqual(
      expect.objectContaining({
        code: 404,
        classId: 40,
      }),
    );
  }, 60000);

  test('assert exchange', async () => {
    await expect(asyncCon.assertExchange('test', 'direct', { durable: true })).resolves.toEqual({ exchange: 'test' });
    await expect(asyncCon.assertExchange('test', 'topic', { durable: true })).rejects.toEqual(
      expect.objectContaining({ code: 406, methodId: 10 }),
    );
  }, 15000);

  test('subscribe', async () => {
    await expect(asyncCon.subscribe((msg, rawMessage) => undefined, { exchange: 'does not exist', routingKey: 'foo' })).rejects.toEqual(
      expect.objectContaining({ code: 404 }),
    );
  });

  test('pub-sub', async () => {
    // stupid done-callback workaround
    return new Promise<void>(async (resolve) => {
      await asyncCon.assertExchange('test', 'direct', { durable: true });
      await asyncCon.subscribe(
        (msg, rawMessage) => {
          expect(msg).toEqual({ foo: 'bar' });
          expect(rawMessage).toBeDefined();
          expect(new TextDecoder().decode(rawMessage.content)).toEqual('{"foo":"bar"}');
          resolve();
          return undefined;
        },
        { exchange: 'test', routingKey: 'foo', queueOptions: { durable: false, exclusive: true } },
      );
      await asyncCon.publish('test', 'foo', { foo: 'bar' });
    });
  });

  test('pub-sub requeue', async () => {
    // stupid done-callback workaround
    let called = false;
    return new Promise<void>(async (resolve) => {
      await asyncCon.assertExchange('test', 'direct', { durable: true });
      await asyncCon.subscribe(
        (msg, rawMessage) => {
          if (!called) {
            called = true;
            return Promise.resolve(new Nack(true));
          }
          expect(called).toBe(true);
          expect(msg).toEqual({ foo: 'bar' });
          expect(rawMessage).toBeDefined();
          expect(new TextDecoder().decode(rawMessage.content)).toEqual('{"foo":"bar"}');
          resolve();
          return undefined;
        },
        { exchange: 'test', routingKey: 'foo', queueOptions: { durable: false, exclusive: true } },
      );
      await asyncCon.publish('test', 'foo', { foo: 'bar' });
    });
  });

  afterEach(async () => {
    await asyncCon.destroy();
  });
});
