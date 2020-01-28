import * as dotenv from 'dotenv';

import { HttpClient } from '../src/api/http.service';

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
      expect(client.getQueueStats().total).toBe(2);
      expect(client.getQueueStats().pending).toBe(1);

      Promise.all(req)
        .then(() => {
          const stats = client.getQueueStats();
          expect(stats.size).toBe(0);
          expect(stats.pending).toBe(0);
          expect(stats.peak).toBe(reqMaxLength - 1);
          expect(stats.total).toBe(reqMaxLength + 1);
          resolve();
        })
        .catch((err) => reject(err));
    });
  }, 60000);
});
