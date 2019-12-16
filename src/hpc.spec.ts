import { HPC } from './hpc';

import * as dotenv from 'dotenv';

dotenv.config();

/* tslint:disable:no-console */
describe('Flow SDK test', () => {
  const hpc = new HPC();

  test('assets', async (done) => {
    let assets = await hpc.assetManager.getMany().catch((err) => logError(err));
    expect(assets).toBeDefined();

    if (assets) {
      expect(Array.isArray(assets.docs)).toBe(true);
      expect(assets.docs.length).toBeGreaterThan(0);
      const assetId = assets.docs[0].id;
      const asset = await hpc.assetManager.getOne(assetId).catch((err) => logError(err));
      expect(asset).toBeDefined();
    }

    assets = await hpc.assetManager.getManyFiltered({ tags: ['test'] }).catch((err) => logError(err));
    expect(assets).toBeDefined();

    done();
  }, 60000);

  test('content', async (done) => {
    const contents = await hpc.contentManager.getMany().catch((err) => logError(err));
    expect(contents).toBeDefined();

    if (contents) {
      expect(Array.isArray(contents.docs)).toBe(true);
      expect(contents.docs.length).toBeGreaterThan(0);
      const contentId = contents.docs[0].id;
      const content = await hpc.contentManager.download(contentId).catch((err) => logError(err));
      expect(content).toBeDefined();
    }

    done();
  }, 60000);

  test('secrets', async (done) => {
    const secrets = await hpc.secretsManager.getMany().catch((err) => logError(err));
    expect(secrets).toBeDefined();

    if (secrets) {
      expect(Array.isArray(secrets.docs)).toBe(true);
      expect(secrets.docs.length).toBeGreaterThan(0);
      const secretId = secrets.docs[0].id;
      const secret = await hpc.secretsManager.getOne(secretId).catch((err) => logError(err));
      expect(secret).toBeDefined();
    }

    done();
  }, 60000);

  test('timeseries', async (done) => {
    const timeseries = await hpc.timeSeriesManager.getMany().catch((err) => logError(err));
    expect(timeseries).toBeDefined();

    if (timeseries) {
      expect(Array.isArray(timeseries.docs)).toBe(true);
      expect(timeseries.docs.length).toBeGreaterThan(0);
      const tsId = timeseries.docs[0].id;
      const ts = await hpc.timeSeriesManager.getOne(tsId).catch((err) => logError(err));
      expect(ts).toBeDefined();

      const values = await hpc.timeSeriesManager.getValues(tsId, 0).catch((err) => logError(err));
      expect(values).toBeDefined();
    }

    done();
  }, 60000);
});

function logError(err: any) {
  if (err && err.response) {
    console.error(err.response.data);
  } else {
    console.error(err);
  }
}
