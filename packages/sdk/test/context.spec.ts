import { IsString } from 'class-validator';
import { CloudEvent } from 'cloudevents';

import { loggerMock } from './mocks/logger.mock';
import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';

/* eslint-disable no-console */
describe('Flow Application', () => {
  test('FLOW.CON.1 Simple Flow Application with Long Running Task', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource', properties: { assetId: '' } },
        { id: 'testResource', module: 'test-module', functionFqn: 'test.resource.TestResource', properties: { assetId: 'abc' } },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
      properties: { test: '123abcd' },
    };

    const flowApp = new FlowApplication([TestModule], flow, { logger: loggerMock, skipApi: true });

    let iteration = 0;
    flowApp.subscribe('testResource.default', {
      next: (event1: FlowEvent) => {
        const data = event1.getData();
        iteration++;
        if (iteration === 1) {
          expect(data.assetId).toEqual('abc');
          expect(data.event).toEqual({});
          expect(data.elementProps).toEqual({ assetId: 'abc' });
          expect(data.flowProps).toEqual({ flow: { test: '123abcd' } });
        } else if (iteration === 2) {
          expect(data.assetId).toEqual('xyz');
          expect(data.event).toEqual({});
          expect(data.elementProps).toEqual({ assetId: 'xyz' });
          expect(data.flowProps).toEqual({ flow: { test: '123abcd' } });
        } else if (iteration === 3) {
          expect(data.assetId).toEqual('123');
          expect(data.event).toEqual({});
          expect(data.elementProps).toEqual({ assetId: '123' });
          expect(data.flowProps).toEqual({ flow: { test: 42 } });
          done();
        }
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));

    flowApp
      .onMessage(
        new CloudEvent<any>({
          source: 'flowstudio/deployments',
          type: 'com.flowstudio.deployment',
          data: { elements: [{ id: 'testResource', properties: { assetId: 'xyz' } }] },
          subject: 'deploymentId.update',
        }),
      )
      .then(() => {
        return flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
      })
      .then(() => {
        return flowApp.onMessage(
          new CloudEvent<any>({
            subject: 'deploymentId.update',
            source: 'flowstudio/deployments',
            type: 'com.flowstudio.deployment',
            data: {
              elements: [{ id: 'testResource', properties: { assetId: '123' } }],
              properties: { test: 42 },
            },
          }),
        );
      })
      .then(() => {
        return flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
      });
  }, 10000);

  test('FLOW.CON.2 string interpolation with event data', async () => {
    let tr = new TestResource({ id: 'testResource', logger: loggerMock }, { assetId: '${test}' });
    let event = await tr.onDefault(new FlowEvent({ id: 'tr' }, { test: 'xyz' }));
    let data = event.getData();
    expect(data).toBeDefined();
    expect(data.assetId).toBe('xyz');

    tr = new TestResource({ id: 'testResource', logger: loggerMock }, { assetId: '${test}' });
    event = await tr.onDefault(new FlowEvent({ id: 'tr' }, { nottest: 'xyz' }));
    data = event.getData();
    expect(data).toBeDefined();
    expect(data.assetId).toBeUndefined();
  });

  test('FLOW.CON.3 string interpolation with flow context properties', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource', properties: { assetId: '' } },
        { id: 'testResource', module: 'test-module', functionFqn: 'test.resource.TestResource', properties: { assetId: '${test}' } },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: { flowId: 'testFlow', deploymentId: 'testDeployment' },
      properties: { test: '123abcd' },
    };
    const flowApp = new FlowApplication([TestModule], flow, { logger: loggerMock, skipApi: true });

    let count = 0;
    flowApp.subscribe('testResource.default', {
      next: (event: FlowEvent) => {
        const data = event.getData();
        expect(data).toBeDefined();
        if (count === 1) {
          expect(data.assetId).toBe('987zyx');
          done();
        } else {
          expect(data.assetId).toBe(undefined);
          count++;
        }
      },
    });
    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, { x: 'y' }));
    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, { test: '987zyx' }));
  });

  test('FLOW.CON.4 untruncated logging', async () => {
    loggerMock.verbose.mockReset();
    const tr = new TestResource({ id: 'testResource', logger: loggerMock }, { assetId: '1234' });
    await tr.onDefault(new FlowEvent({ id: 'tr' }, { test: 'tyz' }));
    expect(loggerMock.verbose).toHaveBeenCalledTimes(1);
    expect(loggerMock.verbose).toHaveBeenCalledWith('test', expect.objectContaining({ truncate: false }));
  });

  test('Flow.CON.5 creation of element without app', () => {
    const elem = new TestResource(
      {
        id: 'testResource',
        logger: loggerMock,
        app: {
          emit: jest.fn(),
          emitPartial: jest.fn(),
        },
      },
      { assetId: '1234' },
    );

    elem.onDefault(new FlowEvent({ id: 'tr' }, { test: 'tyz' }));
    expect(loggerMock.verbose).toHaveBeenCalledTimes(2);
  });
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  constructor(context, properties: unknown) {
    super(context, properties, Properties);
  }

  @InputStream()
  public async onDefault(event) {
    const assetId = this.interpolate(this.properties.assetId, event.getData(), this.flowProperties);
    const data = { assetId, event: {}, elementProps: this.properties, flowProps: this.flowProperties };

    this.logger.verbose('test', { truncate: false });
    return this.emitEvent(data, event);
  }
}

class Properties {
  @IsString()
  assetId: string;
}

@FlowModule({
  name: 'test-module',
  declarations: [TestResource],
})
class TestModule {}
