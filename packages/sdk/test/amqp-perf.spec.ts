import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

import { AsyncConnection } from '../lib/AsyncConnection';

const msgCountSmall = 10000;
const msgSmall = { foo: 'bar' };

const msgCountLarge = 1000;
const msgLarge = require('./fixtures/large-json.json');

const connectionOptions = {
  hostname: process.env.RABBIT_HOST || 'localhost',
  port: process.env.RABBIT_PORT || '5672',
  username: process.env.RABBIT_USER || 'guest',
  password: process.env.RABBIT_PASSWORD || 'guest',
};
const queueOptions = {
  exclusive: false,
  autoDelete: false,
  durable: true,
};

let conn: AmqpConnection;
beforeAll(async () => {
  const { username, password, hostname, port } = connectionOptions;
  conn = new AmqpConnection({
    uri: `amqp://${username}:${password}@${hostname}:${port}`,
  });
  await conn.init();
  await conn.managedChannel.assertExchange('perf-test', 'direct', { durable: false });
  await conn.managedChannel.assertQueue('test', queueOptions);
  await conn.managedChannel.bindQueue('test', 'perf-test', 'test');
});
afterAll(async () => {
  await conn.managedConnection.close();
});

describe('Performance Async Connection', () => {
  let connection: AsyncConnection;

  beforeEach(async () => {
    connection = new AsyncConnection();
    await connection.init(connectionOptions);
  });

  afterEach(async () => {
    await connection.destroy();
  });

  test('publish many small messages', async () => {
    const start = Date.now();
    const count = await send(msgCountSmall, { msgSmall }, connection);
    const duration = (Date.now() - start) / 1000;

    console.log(`${count / duration}/s`);
    expect(count).toBe(msgCountSmall);
    expect(count / duration).toBeGreaterThan(100);
  }, 60000);

  test('receive many small messages', async () => {
    const start = Date.now();
    const count = await receive(msgCountSmall, connection);
    const duration = (Date.now() - start) / 1000;

    console.log(`${count / duration}/s`);
    expect(count).toBe(msgCountSmall);
    expect(count / duration).toBeGreaterThan(1000);
  }, 60000);

  test('publish many large messages', async () => {
    const start = Date.now();
    const count = await send(msgCountLarge, { msgLarge }, connection);
    const duration = (Date.now() - start) / 1000;

    console.log(`${count / duration}/s`);
    expect(count).toBe(msgCountLarge);
    expect(count / duration).toBeGreaterThan(10);
  }, 120000);

  test('receive many large messages', async () => {
    const start = Date.now();
    const count = await receive(msgCountLarge, connection);
    const duration = (Date.now() - start) / 1000;

    console.log(`${count / duration}/s`);
    expect(count).toBe(msgCountLarge);
    expect(count / duration).toBeGreaterThan(1000);
  }, 60000);
});

describe('Performance Not Async Connection', () => {
  let connection: AmqpConnection;

  beforeEach(async () => {
    const { username, password, hostname, port } = connectionOptions;
    connection = new AmqpConnection({
      uri: `amqp://${username}:${password}@${hostname}:${port}`,
    });
    await connection.init();
  });

  afterEach(async () => {
    await connection.managedConnection.close();
  });

  test('publish many small messages', async () => {
    const start = Date.now();
    const count = await send(msgCountSmall, { msgSmall }, connection);
    const duration = (Date.now() - start) / 1000;

    console.log(`${count / duration}/s`);
    expect(count).toBe(msgCountSmall);
    expect(count / duration).toBeGreaterThan(100);
  }, 60000);

  test('receive many small messages', async () => {
    const start = Date.now();
    const count = await receiveNotAsync(msgCountSmall, connection);
    const duration = (Date.now() - start) / 1000;

    console.log(`${count / duration}/s`);
    expect(count).toBe(msgCountSmall);
    expect(count / duration).toBeGreaterThan(1000);
  }, 60000);

  test('publish many large messages', async () => {
    const start = Date.now();
    const count = await send(msgCountLarge, { msgLarge }, connection);
    const duration = (Date.now() - start) / 1000;

    console.log(`${count / duration}/s`);
    expect(count).toBe(msgCountLarge);
    expect(count / duration).toBeGreaterThan(10);
  }, 60000);

  test('receive many large messages', async () => {
    const start = Date.now();
    const count = await receiveNotAsync(msgCountLarge, connection);
    const duration = (Date.now() - start) / 1000;

    console.log(`${count / duration}/s`);
    expect(count).toBe(msgCountLarge);
    expect(count / duration).toBeGreaterThan(100);
  }, 60000);
});

async function send(msgCountSmall: number, msg: any, connection: AmqpConnection | AsyncConnection): Promise<number> {
  let count = 0;
  for (count = 0; count < msgCountSmall; count++) {
    await connection.publish('perf-test', 'test', msg);
  }
  return count;
}

function receive(msgCountSmall: number, connection: AsyncConnection): Promise<number> {
  let count = 0;
  return new Promise<number>(async (resolve) => {
    await connection.subscribe(
      (msg) => {
        count++;
        if (count >= msgCountSmall) {
          resolve(count);
        }
        return undefined;
      },
      {
        exchange: 'perf-test',
        routingKey: 'test',
        queue: 'test',
        queueOptions,
      },
    );
  });
}

function receiveNotAsync(msgCountSmall: number, connection: AmqpConnection): Promise<number> {
  let count = 0;
  return new Promise<number>(async (resolve) => {
    await connection.createSubscriber(
      (msg) => {
        count++;
        if (count >= msgCountSmall) {
          resolve(count);
        }
        return undefined;
      },
      {
        exchange: 'perf-test',
        routingKey: 'test',
        queue: 'test',
        queueOptions,
      },
    );
  });
}
