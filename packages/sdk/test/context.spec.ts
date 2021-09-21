import { IsString } from 'class-validator';
import { CloudEvent } from 'cloudevents';

import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';

// tslint:disable:no-console
describe('Flow Application', () => {
  test('FLOW.CON.1 Simple Flow Application with Long Running Task', async () => {
    const flow = {
      elements: [
        {
          id: 'testTrigger',
          module: 'test.module',
          functionFqn: 'test.resource.TestResource',
          properties: { assetId: '' },
        },
        {
          id: 'testResource',
          module: 'test.module',
          functionFqn: 'test.resource.TestResource',
          properties: { assetId: 'abc' },
        },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
      properties: { test: '123abcd' },
    };
    const flowApp = new FlowApplication([TestModule], flow);

    const promise = new Promise<void>((resolve) => {
      let iteration = 0;
      flowApp.subscribe('testResource.default', {
        next: (event: FlowEvent) => {
          const data = event.getData();
          iteration++;
          if (iteration === 1) {
            expect(data.assetId).toEqual('abc');
            expect(data.event).toEqual({});
            expect(data.elementProps).toEqual({ assetId: 'abc' });
            expect(data.flowProps).toEqual({ test: '123abcd' });
          } else if (iteration === 2) {
            expect(data.assetId).toEqual('xyz');
            expect(data.event).toEqual({});
            expect(data.elementProps).toEqual({ assetId: 'xyz' });
            expect(data.flowProps).toEqual({ test: '123abcd' });
          } else if (iteration === 3) {
            expect(data.assetId).toEqual('123');
            expect(data.event).toEqual({});
            expect(data.elementProps).toEqual({ assetId: '123' });
            expect(data.flowProps).toEqual({ test: 42 });
            resolve();
          }
        },
      });
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));

    let event = new CloudEvent({
      source: 'flowstudio/deployments',
      type: 'com.flowstudio.deployment.update',
      data: { elements: [{ id: 'testResource', properties: { assetId: 'xyz' } }] },
    });

    await flowApp.onMessage(event);

    await new Promise((resolve) => setTimeout(resolve, 100)); // add a bit of delay to make test more consistent

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
    event = new CloudEvent({
      source: 'flowstudio/deployments',
      type: 'com.flowstudio.deployment.update',
      data: {
        elements: [{ id: 'testResource', properties: { assetId: '123' } }],
        properties: { test: 42 },
      },
    });
    await flowApp.onMessage(event);

    await new Promise((resolve) => setTimeout(resolve, 100));

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));

    return promise;
  }, 60000);

  test('FLOW.CON.2 string interpolation with event data', async () => {
    let tr = new TestResource({ id: 'testResource' }, { assetId: '${test}' });
    let event = await tr.onDefault(new FlowEvent({ id: 'tr' }, { test: 'xyz' }));
    let data = event.getData();
    expect(data).toBeDefined();
    expect(data.assetId).toBe('xyz');

    tr = new TestResource({ id: 'testResource' }, { assetId: '${test}' });
    event = await tr.onDefault(new FlowEvent({ id: 'tr' }, { nottest: 'xyz' }));
    data = event.getData();
    expect(data).toBeDefined();
    expect(data.assetId).toBeUndefined();
  });

  test('FLOW.CON.3 string interpolation with flow context properties', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource', properties: { assetId: '' } },
        { id: 'testResource', module: 'test.module', functionFqn: 'test.resource.TestResource', properties: { assetId: '${test}' } },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: { flowId: 'testFlow', deploymentId: 'testDeployment' },
      properties: { test: '123abcd' },
    };
    const flowApp = new FlowApplication([TestModule], flow);

    let count = 0;
    flowApp.subscribe('testResource.default', {
      next: (event: FlowEvent) => {
        const data = event.getData();
        expect(data).toBeDefined();
        if (count === 1) {
          expect(data.assetId).toBe('987zyx');
          done();
        } else {
          expect(data.assetId).toBe('123abcd');
          count++;
        }
      },
    });
    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, { x: 'y' }));
    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, { test: '987zyx' }));
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

    return await this.emitEvent(data, event);
  }
}

class Properties {
  @IsString()
  assetId: string;
}

@FlowModule({
  name: 'test.module',
  declarations: [TestResource],
})
class TestModule {}
