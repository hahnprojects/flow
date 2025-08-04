import { CloudEvent } from 'cloudevents';
import { connect as natsConnect } from '@nats-io/transport-node';

import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';
import { natsFlowsPrefixFlowDeployment, publishNatsEvent } from '../lib/nats';
import { loggerMock } from './mocks/logger.mock';

/* eslint-disable no-console */
describe('Flow SDK', () => {
  test('FLOW.SDK.1 publish message', async () => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'testResource', module: 'test-module', functionFqn: 'test.resource.TestResource' },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    const nc = await natsConnect();
    const flowApp = new FlowApplication([TestModule], flow, { skipApi: true, explicitInit: true, natsConnection: nc });
    await flowApp.init();

    const done = new Promise<void>((resolve, reject) => {
      flowApp.subscribe('testResource.default', {
        next: (event1: FlowEvent) => {
          try {
            expect(event1.getData()).toEqual({ elementId: 'testResource', test: 123 });
            flowApp.destroy(0);
            resolve();
          } catch (e) {
            reject(e);
          }
        },
      });
    });

    const event = new CloudEvent({
      source: 'flowstudio/deployments',
      type: natsFlowsPrefixFlowDeployment,
      subject: 'testDeployment.message',
      data: { elementId: 'testResource', test: 123 },
    });
    await publishNatsEvent(loggerMock, nc, event);
    return done;
  }, 10000);
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  @InputStream('default')
  public async onDefault(event) {
    return this.emitEvent({ hello: 'world' }, event);
  }

  public onMessage = (msg) => {
    this.emitEvent(msg, null);
  };
}

@FlowModule({
  name: 'test-module',
  declarations: [TestResource],
})
class TestModule {}
