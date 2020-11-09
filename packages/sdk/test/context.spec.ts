import { IsString } from 'class-validator';
import { CloudEvent } from 'cloudevents';

import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';

// tslint:disable:no-console
describe('Flow Application', () => {
  test('Simple Flow Application with Long Running Task', async (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource', properties: { assetId: '' } },
        { id: 'testResource', module: 'test.module', functionFqn: 'test.resource.TestResource', properties: { assetId: 'abc' } },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
      properties: { test: '123abcd' },
    };
    const flowApp = new FlowApplication([TestModule], flow, null, null, true);

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
          done();
        }
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));

    let event = new CloudEvent({
      source: 'flowstudio/deployments',
      type: 'com.flowstudio.deployment.update',
      data: { elements: [{ id: 'testResource', properties: { assetId: 'xyz' } }] },
    });
    await flowApp.onMessage(event);
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
    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
  }, 60000);

  test('string interpolation with event data', async (done) => {
    const tr = new TestResource({ id: 'testResource' }, { assetId: '${test}' });

    const event = await tr.onDefault(new FlowEvent({ id: 'tr' }, { test: 'xyz' }));
    const data = event.getData();
    expect(data).toBeDefined();
    expect(data.assetId).toBe('xyz');

    done();
  });

  test('string interpolation with flow context properties', async (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource', properties: { assetId: '' } },
        { id: 'testResource', module: 'test.module', functionFqn: 'test.resource.TestResource', properties: { assetId: '${test}' } },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: { flowId: 'testFlow', deploymentId: 'testDeployment' },
      properties: { test: '123abcd' },
    };
    const flowApp = new FlowApplication([TestModule], flow, null, null, true);

    flowApp.subscribe('testResource.default', {
      next: (event: FlowEvent) => {
        const data = event.getData();
        expect(data).toBeDefined();
        expect(data.assetId).toBe('123abcd');
      },
    });
    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, { x: 'y' }));

    done();
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

    return this.emitOutput(data);
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
