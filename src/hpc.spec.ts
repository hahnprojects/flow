import { HPC } from './hpc';

/* tslint:disable:no-console */
describe('Flow SDK test', () => {
  const hpc = new HPC();

  beforeAll(async () => {}, 10000);

  test('assets', async (done) => {
    let assets = await hpc.assetManager.getMany().catch((err) => console.error(err.response.data));
    expect(assets).toBeDefined();

    if (assets) {
      expect(Array.isArray(assets.docs)).toBe(true);
      expect(assets.docs.length).toBeGreaterThan(0);
      const assetId = assets.docs[0].id;
      const asset = await hpc.assetManager.getOne(assetId).catch((err) => console.error(err.response.data));
      expect(asset).toBeDefined();
    }

    assets = await hpc.assetManager.getManyFiltered({ tags: ['test'] }).catch((err) => console.error(err.response.data));
    expect(assets).toBeDefined();

    done();
  });

  test('content', async (done) => {
    const contents = await hpc.contentManager.getMany().catch((err) => console.error(err.response.data));
    expect(contents).toBeDefined();

    if (contents) {
      expect(Array.isArray(contents.docs)).toBe(true);
      expect(contents.docs.length).toBeGreaterThan(0);
      const contentId = contents.docs[0].id;
      const content = await hpc.contentManager.download(contentId).catch((err) => console.error(err.response.data));
      expect(content).toBeDefined();
    }

    done();
  });

  test('secrets', async (done) => {
    const secrets = await hpc.secretsManager.getMany().catch((err) => console.error(err.response.data));
    expect(secrets).toBeDefined();

    if (secrets) {
      expect(Array.isArray(secrets.docs)).toBe(true);
      expect(secrets.docs.length).toBeGreaterThan(0);
      const secretId = secrets.docs[0].id;
      const secret = await hpc.secretsManager.getOne(secretId).catch((err) => console.error(err.response.data));
      expect(secret).toBeDefined();
    }

    done();
  });

  test('timeseries', async (done) => {
    const timeseries = await hpc.timeSeriesManager.getMany().catch((err) => console.error(err.response.data));
    expect(timeseries).toBeDefined();

    if (timeseries) {
      expect(Array.isArray(timeseries.docs)).toBe(true);
      expect(timeseries.docs.length).toBeGreaterThan(0);
      const tsId = timeseries.docs[0].id;
      const ts = await hpc.timeSeriesManager.getOne(tsId).catch((err) => console.error(err.response.data));
      expect(ts).toBeDefined();

      const values = await hpc.timeSeriesManager.getValues(tsId, 0).catch((err) => console.error(err.response.data));
      expect(values).toBeDefined();
    }

    done();
  });
});
