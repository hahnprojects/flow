import { CloudEvent } from 'cloudevents';

import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';

/* eslint-disable no-console */
describe('Flow SDK', () => {
  test('FLOW.SDK.1 publish message', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource' },
        { id: 'testResource', module: 'test.module', functionFqn: 'test.resource.TestResource' },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    const flowApp = new FlowApplication([TestModule], flow, null, null, true);

    flowApp.subscribe('testResource.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ elementId: 'testResource', test: 123 });
        done();
      },
    });

    const event = new CloudEvent({
      source: 'flowstudio/deployments',
      type: 'com.flowstudio.deployment.message',
      data: { elementId: 'testResource', test: 123 },
    });
    flowApp.onMessage(event);
  }, 60000);
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  @InputStream('default')
  public async onDefault(event) {
    return this.emitOutput({ hello: 'world' });
  }

  public onMessage = (msg) => {
    this.emitOutput(msg);
  };
}

@FlowModule({
  name: 'test.module',
  declarations: [TestResource],
})
class TestModule {}
