import { HttpClient } from './http.service';

import * as dotenv from 'dotenv';

dotenv.config();

/* tslint:disable:no-console */
describe('HTTP Service test', () => {
  test('Concurrent Requests', () => {
    const client = new HttpClient(
      process.env.API_BASE_URL || 'https://testing.hahnpro.com',
      process.env.AUTH_BASE_URL || process.env.API_BASE_URL || 'https://testing.hahnpro.com',
      process.env.AUTH_REALM || 'hpc',
      process.env.API_USER,
      process.env.AUTH_SECRET,
    );

    return new Promise<void>(async (resolve, reject) => {
      expect(client.getQueueStats().total).toBe(0);

      const assets: any = await client.get('api/assets');
      expect(client.getQueueStats().total).toBe(1);

      const req = [];
      const reqMaxLength = Math.min(20, assets.docs.length);
      for (let i = 0; i < reqMaxLength; i++) {
        req.push(client.get(`api/assets/${assets.docs[i].id}`));
      }
      expect(client.getQueueStats().total).toBe(1);

      Promise.all(req)
        .then(() => {
          expect(client.getQueueStats().peak).toBe(reqMaxLength);
          expect(client.getQueueStats().total).toBe(reqMaxLength + 1);
          resolve();
        })
        .catch((err) => reject(err));
    });
  }, 60000);
});
