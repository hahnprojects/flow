import { AmqpConnectionManager, Channel, ChannelWrapper, connect } from 'amqp-connection-manager';
import { CloudEvent } from 'cloudevents';

import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';

/* eslint-disable no-console */
describe('Flow SDK', () => {
  let amqpChannel: ChannelWrapper;
  let amqpConnection: AmqpConnectionManager;

  beforeAll(async () => {
    amqpConnection = connect('amqp://localhost:5672');
    amqpChannel = amqpConnection.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        await channel.assertExchange('deployment', 'direct', { durable: true });
      },
    });
    await amqpChannel.waitForConnect();
  });

  afterAll(async () => {
    await amqpChannel?.close();
    await amqpConnection?.close();
  });

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
    const flowApp = new FlowApplication([TestModule], flow, { amqpConnection, skipApi: true, explicitInit: true });
    await flowApp.init();

    const done = new Promise<void>((resolve, reject) => {
      flowApp.subscribe('testResource.default', {
        next: (event1: FlowEvent) => {
          try {
            expect(event1.getData()).toEqual({ elementId: 'testResource', test: 123 });
            resolve();
          } catch (e) {
            reject(e);
          }
        },
      });
    });

    const event = new CloudEvent({
      source: 'flowstudio/deployments',
      type: 'com.flowstudio.deployment.message',
      data: { elementId: 'testResource', test: 123 },
    });
    amqpChannel.publish('deployment', 'testDeployment', event.toJSON());
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
