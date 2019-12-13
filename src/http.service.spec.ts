import { HttpClient } from './http.service';

import * as dotenv from 'dotenv';

dotenv.config();

/* tslint:disable:no-console */
describe('HTTP Service test', () => {
  beforeAll(async () => {}, 10000);
  test('Concurrent Requests', async (done) => {
    const client = new HttpClient(
      process.env.API_BASE_URL || 'https://testing.hahnpro.com',
      process.env.API_AUTH_URL || process.env.API_BASE_URL || 'https://testing.hahnpro.com',
      process.env.AUTH_REALM || 'hpc',
      process.env.API_USER,
      process.env.AUTH_SECRET,
    );

    await client.get('api/assets');
    const req = [];
    for (let i = 0; i < 20; i++) {
      req.push(client.get('api/assets'));
    }
    Promise.all(req);
    await sleep(500);
    const size = client.getQueueSize();
    console.log('QueueSize ' + size);
    console.log('Pending Requests ' + client.getPendingRequestCount());

    await sleep(1000);
    expect(client.getQueueSize()).toBeLessThan(size);
    console.log('QueueSize ' + client.getQueueSize());
    done();
  });
});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
