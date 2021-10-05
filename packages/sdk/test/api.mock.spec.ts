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
  test('FLOW.API.MOCK.1 assets', async () => {
    let assets = await api.assets.getMany().catch((err) => logError(err));
    expect(assets).toBeDefined();

    if (assets) {
      expect(Array.isArray(assets.docs)).toBe(true);
      expect(assets.docs.length).toBeGreaterThan(0);
      const assetId = assets.docs[0].id;
      const asset = await api.assets.getOne(assetId).catch((err) => logError(err));
      expect(asset).toBeDefined();
    }

    assets = await api.assets.getManyFiltered({ tags: ['test'] }).catch((err) => logError(err));
    expect(assets).toBeDefined();

    assets = await api.assets.getMany({ populate: 'type' }).catch((err) => logError(err));
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

  test('FLOW.API.MOCK.2 content', async () => {
    const contents = await api.contents.getMany().catch((err) => logError(err));
    expect(contents).toBeDefined();

    if (contents) {
      expect(Array.isArray(contents.docs)).toBe(true);
      expect(contents.docs.length).toBeGreaterThan(0);
      const contentId = contents.docs[0].id;
      const content = await api.contents.download(contentId).catch((err) => logError(err));
      expect(content).toBeDefined();

      const testDownloadId = contents.docs[1].id;
      const arrBuf = await api.contents.download(testDownloadId, true).catch((err) => logError(err));
      expect(arrBuf instanceof ArrayBuffer).toBeTruthy();

      const str = await api.contents.download(testDownloadId).catch((err) => logError(err));
      expect(typeof str).toBe('string');
      expect(str).toBe('{"test": "data"}');

      const json = await api.contents.download(testDownloadId, ReturnType.TEXT).catch((err) => logError(err));
      expect(typeof json).toBe('string');
      expect(json).toBe('{"test": "data"}');

      const parsedJson = await api.contents.download(testDownloadId, ReturnType.JSON).catch((err) => logError(err));
      expect(typeof parsedJson).toBe('object');
      expect(parsedJson).toEqual({ test: 'data' });

      const ab = await api.contents.download(testDownloadId, ReturnType.ARRAYBUFFER).catch((err) => logError(err));
      expect(ab instanceof ArrayBuffer).toBeTruthy();

      const buf = await api.contents.download(testDownloadId, ReturnType.NODEBUFFER).catch((err) => logError(err));
      expect(buf instanceof Buffer).toBeTruthy();

      const stream = await api.contents.download(testDownloadId, ReturnType.NODESTREAM).catch((err) => logError(err));
      expect(stream instanceof Readable).toBeTruthy();
    }
  }, 60000);

  test('FLOW.API.MOCK.3 endpoint', async () => {
    const sendNotifMock = jest.spyOn(api.endpointManager, 'sendNotification');
    await api.endpointManager.sendNotification('endpoint1', 'test', 'Test', 'test').catch((err) => logError(err));
    expect(sendNotifMock).toBeCalledTimes(1);
    expect(sendNotifMock).toBeCalledWith('endpoint1', 'test', 'Test', 'test');

    await api.endpointManager.sendNotification('endpoint1', 'test', 'Test', 'test', 'readme', 'asset').catch((err) => logError(err));
    expect(sendNotifMock).toBeCalledTimes(2);
    expect(sendNotifMock).toBeCalledWith('endpoint1', 'test', 'Test', 'test', 'readme', 'asset');

    const log = await api.endpointManager.readLastLogByGroup('endpoint1', 'test');
    expect(log).toBeDefined();
  }, 60000);

  test('FLOW.API.MOCK.4 secrets', async () => {
    const secrets = await api.secrets.getMany().catch((err) => logError(err));
    expect(secrets).toBeDefined();

    if (secrets) {
      expect(Array.isArray(secrets.docs)).toBe(true);
      expect(secrets.docs.length).toBeGreaterThan(0);
      const secretId = secrets.docs[0].id;
      const secret = await api.secrets.getOne(secretId).catch((err) => logError(err));
      expect(secret).toBeDefined();
    }
  }, 60000);

  test('FLOW.API.MOCK.5 events', async () => {
    const events = await api.events.getMany().catch((err) => logError(err));
    expect(events).toBeDefined();

    if (events) {
      expect(Array.isArray(events.docs)).toBe(true);
      expect(events.docs.length).toBeGreaterThan(0);
      const eventId = events.docs[0].id;
      const event = await api.events.getOne(eventId).catch((err) => logError(err));
      expect(event).toBeDefined();

      const lastEvent = await api.events.getLastEventByAssetAndGroup('asset1', 'test').catch((err) => logError(err));
      expect(lastEvent).toBeDefined();
    }
  }, 60000);

  test('FLOW.API.MOCK.6 timeseries', async () => {
    const timeseries = await api.timeSeries.getMany().catch((err) => logError(err));
    expect(timeseries).toBeDefined();

    if (timeseries) {
      expect(Array.isArray(timeseries.docs)).toBe(true);
      expect(timeseries.docs.length).toBeGreaterThan(0);
      const tsId = timeseries.docs[0].id;
      const ts = await api.timeSeries.getOne(tsId).catch((err) => logError(err));
      expect(ts).toBeDefined();

      const values = await api.timeSeries.getValues(tsId, 0).catch((err) => logError(err));
      expect(values).toBeDefined();
    }
  }, 60000);

  test('FLOW.API.MOCK.7 tasks', async () => {
    const tasks = await api.tasks.getMany().catch((err) => logError(err));
    expect(tasks).toBeDefined();

    if (tasks) {
      expect(Array.isArray(tasks.docs)).toBe(true);
      expect(tasks.docs.length).toBeGreaterThan(0);
      const tskId = tasks.docs[0].id;
      const tsk = await api.tasks.getOne(tskId).catch((err) => logError(err));
      expect(tsk).toBeDefined();
    }
  }, 60000);

  test('FLOW.API.MOCK.8 user', async () => {
    const roles = await api.users.getCurrentUserRoles();
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
