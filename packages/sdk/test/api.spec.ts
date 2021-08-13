import * as dotenv from 'dotenv';

import { API } from '../lib';

dotenv.config();

/* tslint:disable:no-console */
describe('API test', () => {
  const api = new API();

  test('FLOW.API.1 assets', async () => {
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

  test('FLOW.API.2 content', async () => {
    const contents = await api.contentManager.getMany().catch((err) => logError(err));
    expect(contents).toBeDefined();

    if (contents) {
      expect(Array.isArray(contents.docs)).toBe(true);
      expect(contents.docs.length).toBeGreaterThan(0);
      const contentId = contents.docs[0].id;
      const content = await api.contentManager.download(contentId).catch((err) => logError(err));
      expect(content).toBeDefined();
    }
  }, 60000);

  test('FLOW.API.3 endpoint', async () => {
    const mockedSendFn = jest.spyOn(api.endpointManager, 'sendNotification');
    await api.endpointManager.sendNotification('endpoint1', 'test', 'Test', 'test').catch((err) => logError(err));
    expect(mockedSendFn).toHaveBeenCalledWith('endpoint1', 'test', 'Test', 'test');
  }, 60000);

  test('FLOW.API.4 secrets', async () => {
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

  test('FLOW.API.5 events', async () => {
    const events = await api.eventsManager.getMany().catch((err) => logError(err));
    expect(events).toBeDefined();

    if (events) {
      expect(Array.isArray(events.docs)).toBe(true);
      expect(events.docs.length).toBeGreaterThan(0);
      const eventId = events.docs[0].id;
      const event = await api.eventsManager.getOne(eventId).catch((err) => logError(err));
      expect(event).toBeDefined();
    }
  }, 60000);

  test('FLOW.API.6 timeseries', async () => {
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

  test('FLOW.API.7 tasks', async () => {
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

  test('FLOW.API.8 user', async () => {
    const roles = await api.userManager.getCurrentUserRoles();
    expect(roles).toBeDefined();

    if (roles) {
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
    }
  }, 60000);
});

function logError(err: any) {
  if (err && err.response) {
    console.error(err.response.data);
  } else {
    console.error(err);
  }
}
