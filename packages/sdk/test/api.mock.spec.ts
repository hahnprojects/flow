import * as dotenv from 'dotenv';

import { MockAPI, ReturnType } from '../lib';
import { Readable } from 'stream';

dotenv.config();

/* tslint:disable:no-console */
describe('Mock-API test', () => {
  const api = new MockAPI({
    assets: [{ id: 'asset1', name: 'testAsset', type: { id: 'testId', name: 'testType' } }],
    contents: [
      { id: 'content1', filename: 'testContent.txt', filePath: __dirname, mimetype: 'text/plain' },
      { id: 'content2', data: '{"test": "data"}', filename: 'something.json' },
    ],
    endpoints: [{ id: 'endpoint1', name: 'test' }],
    secrets: [{ id: 'secret1', key: 'test', name: 'testSecret' }],
    timeSeries: [{ id: 'timeseries1', name: 'testTimeseries', values: [{ timestamp: Date.now(), value: 'test' }] }],
    tasks: [{ id: 'tasks1', name: 'testTasks', assignedTo: ['alice'] }], // TODO: TEST Tasks API
    events: [{ id: 'events1', name: 'testEvents', level: 'OK', cause: 'test' }],
    users: { roles: ['test1', 'test2'] },
  });

  // tests copied from api.spec.ts
  // mock-api should behave the same way the normal api does
  test('assets', async () => {
    let assets = await api.assetManager.getMany().catch((err) => logError(err));
    expect(assets).toBeDefined();

    if (assets) {
      expect(Array.isArray(assets.docs)).toBe(true);
      expect(assets.docs.length).toBeGreaterThan(0);
      const assetId = assets.docs[0].id;
      const asset = await api.assetManager.getOne(assetId).catch((err) => logError(err));
      expect(asset).toBeDefined();
    }

    assets = await api.assetManager.getManyFiltered({ tags: ['test'] }).catch((err) => logError(err));
    expect(assets).toBeDefined();

    assets = await api.assetManager.getMany({ populate: 'type' }).catch((err) => logError(err));
    expect(assets).toBeDefined();
    if (assets) {
      expect(Array.isArray(assets.docs)).toBe(true);
      expect(assets.docs.length).toBeGreaterThan(0);
      const asset = assets.docs[0];
      expect(asset).toBeDefined();
      if (asset) {
        expect(asset.type).toHaveProperty('id');
      }
    }
  }, 60000);

  test('content', async () => {
    const contents = await api.contentManager.getMany().catch((err) => logError(err));
    expect(contents).toBeDefined();

    if (contents) {
      expect(Array.isArray(contents.docs)).toBe(true);
      expect(contents.docs.length).toBeGreaterThan(0);
      const contentId = contents.docs[0].id;
      const content = await api.contentManager.download(contentId).catch((err) => logError(err));
      expect(content).toBeDefined();

      const testDownloadId = contents.docs[1].id;
      const arrBuf = await api.contentManager.download(testDownloadId, true).catch((err) => logError(err));
      expect(arrBuf instanceof ArrayBuffer).toBeTruthy();

      const str = await api.contentManager.download(testDownloadId).catch((err) => logError(err));
      expect(typeof str).toBe('string');
      expect(str).toBe('{"test": "data"}');

      const json = await api.contentManager.download(testDownloadId, ReturnType.TEXT).catch((err) => logError(err));
      expect(typeof json).toBe('string');
      expect(json).toBe('{"test": "data"}');

      const parsedJson = await api.contentManager.download(testDownloadId, ReturnType.JSON).catch((err) => logError(err));
      expect(typeof parsedJson).toBe('object');
      expect(parsedJson).toEqual({ test: 'data' });

      const ab = await api.contentManager.download(testDownloadId, ReturnType.ARRAYBUFFER).catch((err) => logError(err));
      expect(ab instanceof ArrayBuffer).toBeTruthy();

      const buf = await api.contentManager.download(testDownloadId, ReturnType.NODEBUFFER).catch((err) => logError(err));
      expect(buf instanceof Buffer).toBeTruthy();

      const stream = await api.contentManager.download(testDownloadId, ReturnType.NODESTREAM).catch((err) => logError(err));
      expect(stream instanceof Readable).toBeTruthy();
    }
  }, 60000);

  test('endpoint', async () => {
    const test = await api.endpointManager.sendNotification('endpoint1', 'test', 'Test', 'test').catch((err) => logError(err));
    expect(test).toBeDefined();
    expect(test.subject).toBe('test');
    expect(test.message).toBe('Test');
    expect(test.group).toBe('test');

    const log = await api.endpointManager.readLastLogByGroup('endpoint1', 'test');
    expect(log).toBeDefined();
  }, 60000);

  test('secrets', async () => {
    const secrets = await api.secretsManager.getMany().catch((err) => logError(err));
    expect(secrets).toBeDefined();

    if (secrets) {
      expect(Array.isArray(secrets.docs)).toBe(true);
      expect(secrets.docs.length).toBeGreaterThan(0);
      const secretId = secrets.docs[0].id;
      const secret = await api.secretsManager.getOne(secretId).catch((err) => logError(err));
      expect(secret).toBeDefined();
    }
  }, 60000);

  test('events', async () => {
    const events = await api.eventsManager.getMany().catch((err) => logError(err));
    expect(events).toBeDefined();

    if (events) {
      expect(Array.isArray(events.docs)).toBe(true);
      expect(events.docs.length).toBeGreaterThan(0);
      const eventId = events.docs[0].id;
      const event = await api.eventsManager.getOne(eventId).catch((err) => logError(err));
      expect(event).toBeDefined();

      const lastEvent = await api.eventsManager.getLastEventByAssetAndGroup('asset1', 'test').catch((err) => logError(err));
      expect(lastEvent).toBeDefined();
    }
  }, 60000);

  test('timeseries', async () => {
    const timeseries = await api.timeSeriesManager.getMany().catch((err) => logError(err));
    expect(timeseries).toBeDefined();

    if (timeseries) {
      expect(Array.isArray(timeseries.docs)).toBe(true);
      expect(timeseries.docs.length).toBeGreaterThan(0);
      const tsId = timeseries.docs[0].id;
      const ts = await api.timeSeriesManager.getOne(tsId).catch((err) => logError(err));
      expect(ts).toBeDefined();

      const values = await api.timeSeriesManager.getValues(tsId, 0).catch((err) => logError(err));
      expect(values).toBeDefined();
    }
  }, 60000);

  test('tasks', async () => {
    const tasks = await api.taskManager.getMany().catch((err) => logError(err));
    expect(tasks).toBeDefined();

    if (tasks) {
      expect(Array.isArray(tasks.docs)).toBe(true);
      expect(tasks.docs.length).toBeGreaterThan(0);
      const tskId = tasks.docs[0].id;
      const tsk = await api.taskManager.getOne(tskId).catch((err) => logError(err));
      expect(tsk).toBeDefined();
    }
  }, 60000);

  test('user', async () => {
    const roles = await api.userManager.getCurrentUserRoles();
    expect(roles).toBeDefined();

    if (roles) {
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
      expect(roles).toEqual(['test1', 'test2']);
    }
  });
});

function logError(err: any) {
  if (err && err.response) {
    console.error(err.response.data);
  } else {
    console.error(err);
  }
}
