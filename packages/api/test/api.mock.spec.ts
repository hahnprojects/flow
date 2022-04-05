import * as dotenv from 'dotenv';

import { HistoryEntry, MockAPI, ReturnType } from '../lib';
import { Readable } from 'stream';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

dotenv.config();

/* eslint-disable no-console */
describe('Mock-API test', () => {
  const api = new MockAPI({
    assets: [{ id: 'asset1', name: 'testAsset', type: { id: 'testId', name: 'testType' } }],
    revisions: [{ id: 'revision1', originalId: 'asset1', name: 'testRevision', type: { id: 'testId', name: 'testType' } }],
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
    flows: [{ id: 'flow1' }],
    diagrams: [{ id: 'diagram1', flow: 'flow1' }],
    functions: [
      { fqn: 'testFunc', id: '123' },
      { fqn: 'test.history.function', history: ['123'], id: 'foo' },
    ],
    deployments: [{ flow: 'flow1', id: '623ae4cedeaf1681711ff3b0', diagram: 'diagram1', refs: [{ id: 'asset1', resourceType: 'asset' }] }],
    modules: [{ name: 'testMod', artifacts: [{ filename: 'test.zip', path: join(__dirname, 'testFile.zip') }] }],
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
    await api.endpointManager.sendNotification('endpoint1', { subject: 'test', message: 'Test' }).catch((err) => logError(err));
    expect(sendNotifMock).toBeCalledTimes(1);
    expect(sendNotifMock).toBeCalledWith('endpoint1', { subject: 'test', message: 'Test' });

    await api.endpointManager
      .sendNotification('endpoint1', {
        subject: 'test',
        message: 'Test',
        group: 'test',
        level: 'INFO',
        eventLink: 'readme',
        assetId: 'asset1',
        assetName: 'asset',
        assetLink: 'readme',
      })
      .catch((err) => logError(err));
    expect(sendNotifMock).toBeCalledTimes(2);
    expect(sendNotifMock).toBeCalledWith('endpoint1', {
      subject: 'test',
      message: 'Test',
      group: 'test',
      level: 'INFO',
      eventLink: 'readme',
      assetId: 'asset1',
      assetName: 'asset',
      assetLink: 'readme',
    });

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

  test('FLOW.API.MOCK.9 asset revisions', async () => {
    const assets = await api.assets.getMany();
    expect(assets).toBeDefined();

    const revisions = await api.assets.findRevisions(assets.docs[0].id).catch((err) => logError(err));
    expect(revisions).toBeDefined();

    if (revisions) {
      expect(Array.isArray(revisions.docs)).toBe(true);
      expect(revisions.docs.length).toBeGreaterThan(0);
      const revision = revisions.docs[0];
      expect(revision).toBeDefined();
      if (revision) {
        expect(revision.type).toHaveProperty('id');
      }
    }
  }, 60000);

  test('FLOW-API.MOCK.10 flows', async () => {
    let flows = await api.flows.getMany().catch((err) => logError(err));
    expect(flows).toBeDefined();

    if (flows) {
      expect(Array.isArray(flows.docs)).toBe(true);
      expect(flows.docs.length).toBeGreaterThan(0);
      const flowId = flows.docs[0].id;
      const flow = await api.flows.getOne(flowId);
      expect(flow).toBeDefined();
      const flowWithDiagram = await api.flows.getFlowWithDiagram(flow.diagram as string);
      expect(flow.id).toEqual(flowWithDiagram.id);
    }

    flows = await api.flows.getManyFiltered({ tags: ['test'] }).catch((err) => logError(err));
    expect(flows).toBeDefined();

    flows = await api.flows.getMany({ populate: 'diagram' }).catch((err) => logError(err));
    expect(flows).toBeDefined();

    if (flows) {
      expect(Array.isArray(flows.docs)).toBe(true);
      expect(flows.docs.length).toBeGreaterThan(0);
      const flow = flows.docs[0];
      expect(flow).toBeDefined();
      if (flow) {
        expect(flow.diagram).toHaveProperty('id');
      }
    }
  }, 60000);

  test('FLOW-API.MOCK.11 flow-functions', async () => {
    let functions = await api.flowFunctions.getMany().catch((err) => logError(err));
    expect(functions).toBeDefined();

    if (functions) {
      expect(Array.isArray(functions.docs)).toBe(true);
      expect(functions.docs.length).toBeGreaterThan(0);
      const functionFqn = functions.docs[0].fqn;
      let function1 = await api.flowFunctions.getOne(functionFqn);
      expect(function1).toBeDefined();
      expect(typeof function1.history[0]).toBe('string');
      function1 = await api.flowFunctions.getOneWithHistory(functionFqn);
      expect(typeof function1.history[0]).toBe('object');
      expect(function1.history[0]).toHaveProperty('author');
    }

    functions = await api.flowFunctions.getManyFiltered({ tags: ['test'] }).catch((err) => logError(err));
    expect(functions).toBeDefined();

    let function2 = await api.flowFunctions.getOne('test.history.function');

    const historyId = ((await api.flowFunctions.getOneWithHistory('test.history.function')).history[1] as HistoryEntry).id;

    expect(function2.category).toBe('task');
    function2 = await api.flowFunctions.updateOne('test.history.function', { ...function2, category: 'resource' });
    expect(function2.category).toBe('resource');

    function2 = await api.flowFunctions.rollback('test.history.function', historyId);

    expect(function2.category).toBe('task');
    expect(function2.current).toBe(historyId);
  }, 60000);

  test('FLOW-API.MOCK.12 flow-deployments', async () => {
    let deployments = await api.flowDeployments.getMany().catch((err) => logError(err));
    expect(deployments).toBeDefined();

    if (deployments) {
      expect(Array.isArray(deployments.docs)).toBe(true);
      expect(deployments.docs.length).toBeGreaterThan(0);
      const deplId = deployments.docs[0].id;
      const deployment = await api.flowDeployments.getOne(deplId).catch((err) => logError(err));
      expect(deployment).toBeDefined();
    }

    deployments = await api.flowDeployments.getManyFiltered({ tags: ['test'] }).catch((err) => logError(err));
    expect(deployments).toBeDefined();

    const deplId = '623ae4cedeaf1681711ff3b0';
    const depl = await api.flowDeployments.getOne(deplId);

    const statistic = await api.flowDeployments.getDeploymentStatistics(deplId);
    expect(statistic.metrics.deploymentId).toEqual(deplId);

    const metrics = await api.flowDeployments.getDeploymentMetrics(deplId);
    expect(Array.isArray(metrics.metrics)).toBe(true);
    expect(metrics.stats).toHaveProperty('cpu');
    expect(metrics.stats).toHaveProperty('memory');

    const logs = await api.flowDeployments.getDeploymentLogs(deplId);
    expect(Array.isArray(logs)).toBe(true);
    expect(logs[0].deploymentId).toEqual(deplId);

    const references = await api.flowDeployments.resolveReferences(deplId);
    expect(Array.isArray(references)).toBe(true);
    expect(references[0].resourceType).toBe('asset');

    const assetId = (await api.assets.getMany()).docs[0].id;

    let deployment1 = await api.flowDeployments.addOne({
      diagramId: depl.diagram as string,
      name: 'deployment from api',
      properties: { assetId },
    });
    expect(deployment1.desiredStatus).toEqual('running');
    expect(deployment1.actualStatus).toEqual('generating queued');
    expect(deployment1.refs[0].id).toEqual(assetId);
    expect(deployment1.flowModel.properties).toEqual({ assetId });

    let flow = await api.flows.getFlowWithDiagram(deployment1.diagram as string);
    expect(flow.deployments).toContain(deployment1.id);

    await api.flowDeployments.waitForRunningStatus(deployment1.id);

    deployment1 = await api.flowDeployments.updateStatus(deployment1.id, 'stopped');
    expect(deployment1.desiredStatus).toEqual('stopped');

    await api.flowDeployments.deleteOne(deployment1.id);
    flow = await api.flows.getOne(flow.id);
    expect(flow.deployments).not.toContain(deployment1.id);
  }, 60000);

  test('FLOW-API.MOCK.13 flow-modules', async () => {
    const modules = await api.flowModules.getMany().catch((err) => logError(err));
    expect(modules).toBeDefined();

    if (modules) {
      expect(Array.isArray(modules.docs)).toBe(true);
      expect(modules.docs.length).toBeGreaterThan(0);
      const moduleName = modules.docs[0].name;
      const module = await api.flowModules.getOne(moduleName);
      expect(module).toBeDefined();

      await api.flowModules.download(moduleName, join(__dirname, module.artifacts[0].filename));
      expect(existsSync(join(__dirname, module.artifacts[0].filename))).toBe(true);
      unlinkSync(join(__dirname, module.artifacts[0].filename));
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
