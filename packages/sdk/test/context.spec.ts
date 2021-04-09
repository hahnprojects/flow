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

    await flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));

    let event = new CloudEvent({
      source: 'flowstudio/deployments',
      type: 'com.flowstudio.deployment.update',
      data: { elements: [{ id: 'testResource', properties: { assetId: 'xyz' } }] },
    });
    await flowApp.onMessage(event);
    await flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {})); // await necessary as otherwise the event gets lost for some reason

    event = new CloudEvent({
      source: 'flowstudio/deployments',
      type: 'com.flowstudio.deployment.update',
      data: {
        elements: [{ id: 'testResource', properties: { assetId: '123' } }],
        properties: { test: 42 },
      },
    });
    await flowApp.onMessage(event);
    await flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
  }, 60000);

  test('string interpolation with event data', async (done) => {
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
