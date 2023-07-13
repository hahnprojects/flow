import * as dotenv from 'dotenv';

import { API, FlowDeployment } from '../lib';
import { testTrash } from './helper';

dotenv.config();

/* eslint-disable no-console */
describe('API test', () => {
  const api = new API();

  test('FLOW.API.1 assets', async () => {
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

    assets = await api.assets.getMany().catch((err) => logError(err));
    expect(assets).toBeDefined();

    if (assets) {
      const assetId = assets.docs[0].id;
      const revisions = await api.assets.getRevisions(assetId).catch((err) => logError(err));
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

      await api.assets.updateEventCausesAsset('asset1', { cause: 'cause1', level: 'WARNING' });
      await api.assets.updateEventCausesAsset('asset1', { cause: 'cause1', level: 'CRITICAL' });
      await api.assets.updateEventCausesAsset('asset2', { cause: 'cause2', level: 'INFO' });
      await api.assets.updateEventCausesAsset('asset2', { cause: 'cause3', level: 'OK' });

      const eventCauses = await api.assets.getEventLevelOverride(['asset1', 'asset2'], ['cause1', 'cause2', 'cause3']);
      expect(eventCauses).toEqual({ asset1: { cause1: 'CRITICAL' }, asset2: { cause2: 'INFO', cause3: 'OK' } });

      const asset = assets.docs[assets.docs.length - 1];
      await testTrash(asset.id, api.assets);
    }
  }, 60000);

  test('FLOW.API.2 content', async () => {
    const contents = await api.contents.getMany().catch((err) => logError(err));
    expect(contents).toBeDefined();

    if (contents) {
      expect(Array.isArray(contents.docs)).toBe(true);
      expect(contents.docs.length).toBeGreaterThan(0);
      const contentId = contents.docs[0].id;
      const content = await api.contents.download(contentId).catch((err) => logError(err));
      expect(content).toBeDefined();

      await testTrash(contentId, api.contents);
    }
  }, 60000);

  test('FLOW.API.3 endpoint', async () => {
    const mockedSendFn = jest.spyOn(api.endpoints, 'sendNotification');
    await api.endpoints
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
    expect(mockedSendFn).toHaveBeenCalledWith('endpoint1', {
      subject: 'test',
      message: 'Test',
      group: 'test',
      level: 'INFO',
      eventLink: 'readme',
      assetId: 'asset1',
      assetName: 'asset',
      assetLink: 'readme',
    });
  }, 60000);

  test('FLOW.API.4 secrets', async () => {
    const secrets = await api.secrets.getMany().catch((err) => logError(err));
    expect(secrets).toBeDefined();

    if (secrets) {
      expect(Array.isArray(secrets.docs)).toBe(true);
      expect(secrets.docs.length).toBeGreaterThan(0);
      const secretId = secrets.docs[0].id;
      const secret = await api.secrets.getOne(secretId).catch((err) => logError(err));
      expect(secret).toBeDefined();

      await testTrash(secretId, api.secrets);
    }
  }, 60000);

  test('FLOW.API.5 events', async () => {
    const events = await api.events.getMany().catch((err) => logError(err));
    expect(events).toBeDefined();

    if (events) {
      expect(Array.isArray(events.docs)).toBe(true);
      expect(events.docs.length).toBeGreaterThan(0);
      const eventId = events.docs[0].id;
      const event = await api.events.getOne(eventId).catch((err) => logError(err));
      expect(event).toBeDefined();
    }
  }, 60000);

  test('FLOW.API.6 timeseries', async () => {
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

      await testTrash(tsId, api.timeSeries);
    }
  }, 60000);

  test('FLOW.API.7 tasks', async () => {
    const tasks = await api.tasks.getMany().catch((err) => logError(err));
    expect(tasks).toBeDefined();

    if (tasks) {
      expect(Array.isArray(tasks.docs)).toBe(true);
      expect(tasks.docs.length).toBeGreaterThan(0);
      const tskId = tasks.docs[0].id;
      const tsk = await api.tasks.getOne(tskId).catch((err) => logError(err));
      expect(tsk).toBeDefined();

      await testTrash(tskId, api.tasks);
    }
  }, 60000);

  test('FLOW.API.8 user', async () => {
    const roles = await api.users.getCurrentUserRoles();
    expect(roles).toBeDefined();

    if (roles) {
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
    }
  }, 60000);

  test('FLOW-API.9 flows', async () => {
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

    flows = await api.flows.getMany().catch((err) => logError(err));
    expect(flows).toBeDefined();

    if (flows) {
      const flowId = flows.docs[0].id;
      const revisions = await api.flows.getRevisions(flowId).catch((err) => logError(err));
      expect(revisions).toBeDefined();

      if (revisions) {
        expect(Array.isArray(revisions.docs)).toBe(true);
        expect(revisions.docs.length).toBeGreaterThan(0);
        const revision = revisions.docs[0];
        expect(revision).toBeDefined();
        if (revision) {
          expect(revision.diagram).toBe('diagram1');
        }
      }
    }
  }, 60000);

  test('FLOW-API.10 flow-functions', async () => {
    let functions = await api.flowFunctions.getMany().catch((err) => logError(err));
    expect(functions).toBeDefined();

    if (functions) {
      expect(Array.isArray(functions.docs)).toBe(true);
      expect(functions.docs.length).toBeGreaterThan(0);
      const functionFqn = functions.docs[0].fqn;
      const function1 = await api.flowFunctions.getOne(functionFqn);
      expect(function1).toBeDefined();
    }

    functions = await api.flowFunctions.getManyFiltered({ tags: ['test'] }).catch((err) => logError(err));
    expect(functions).toBeDefined();

    functions = await api.flowFunctions.getMany().catch((err) => logError(err));
    expect(functions).toBeDefined();

    if (functions) {
      const functionFqn = functions.docs[0].fqn;
      const revisions = await api.flowFunctions.getRevisions(functionFqn).catch((err) => logError(err));
      expect(revisions).toBeDefined();

      if (revisions) {
        expect(Array.isArray(revisions.docs)).toBe(true);
        expect(revisions.docs.length).toBeGreaterThan(0);
        const revision = revisions.docs[0];
        expect(revision).toBeDefined();
      }
    }
  }, 60000);

  test('FLOW-API.11 flow-deployments', async () => {
    let deployments = await api.flowDeployments.getMany().catch((err) => logError(err));
    expect(deployments).toBeDefined();

    if (deployments) {
      expect(Array.isArray(deployments.docs)).toBe(true);
      expect(deployments.docs.length).toBeGreaterThan(0);
      const deplId1 = deployments.docs[0].id;
      const deployment = (await api.flowDeployments.getOne(deplId1).catch((err) => logError(err))) as FlowDeployment;
      expect(deployment).toBeDefined();
      expect(await api.flows.isDeploymentOnLatestDiagramVersion(deployment)).toBe(true);
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

  test('FLOW-API.12 flow-modules', async () => {
    const modules = await api.flowModules.getMany().catch((err) => logError(err));
    expect(modules).toBeDefined();

    if (modules) {
      expect(Array.isArray(modules.docs)).toBe(true);
      expect(modules.docs.length).toBeGreaterThan(0);
      const moduleName = modules.docs[0].name;
      const module = await api.flowModules.getOne(moduleName);
      expect(module).toBeDefined();
    }
  }, 60000);

  test('FLOW-API.13 labels', async () => {
    const labels = await api.labels.getMany().catch((err) => logError(err));
    expect(labels).toBeDefined();

    if (labels) {
      expect(Array.isArray(labels.docs)).toBe(true);
      expect(labels.docs.length).toBeGreaterThan(0);
      const labelId = labels.docs[0].id;
      const label1 = await api.labels.getOne(labelId);
      expect(label1).toBeDefined();
    }

    const label = await api.labels.getOneByName('e2e');
    expect(label).toBeDefined();
    expect(label.name).toBe('e2e');

    const newLabel = await api.labels.addOne({
      name: 'new label',
      description: 'label created by api',
      readWritePermissions: ['user'],
      readPermissions: [],
    });
    expect(newLabel).toBeDefined();
    expect(newLabel.name).toBe('new label');

    const count = await api.labels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('FLOW-API.14 notifications', async () => {
    const notifications = await api.notifications.getMany().catch((err) => logError(err));
    expect(notifications).toBeDefined();

    if (notifications) {
      expect(Array.isArray(notifications.docs)).toBe(true);
      expect(notifications.docs.length).toBeGreaterThan(0);
      const notificationId = notifications.docs[0].id;
      const notification1 = await api.labels.getOne(notificationId);
      expect(notification1).toBeDefined();
    }

    const newNotification = await api.notifications.addOne({
      name: 'Test Notification',
      description: 'notification created by api',
      userId: '1314143-2424ido2',
      notificationType: 'WARNING',
    });
    expect(newNotification).toBeDefined();
    expect(newNotification.name).toBe('Test Notification');
  });
});

function logError(err: any) {
  if (err && err.response) {
    console.error(err.response.data);
  } else {
    console.error(err);
  }
}
