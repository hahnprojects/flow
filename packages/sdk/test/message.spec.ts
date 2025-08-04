import { CloudEvent } from 'cloudevents';
import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';
import { natsFlowsPrefixFlowDeployment, publishNatsEvent } from '../lib/nats';
import { loggerMock } from './mocks/logger.mock';
import { natsPrepareForRealNats } from './mocks/nats-prepare.reals-nats';

describe('Flow SDK', () => {
  afterEach(() => {
    jest.resetAllMocks();
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

    const nc = await natsPrepareForRealNats(loggerMock);
    const flowApp = new FlowApplication([TestModule], flow, { skipApi: true, logger: loggerMock, explicitInit: true, natsConnection: nc });
    await flowApp.init();

    const spy = jest.spyOn((flowApp as any)?.elements['testResource'], 'onMessage');
    const event = new CloudEvent({
      source: 'flowstudio/deployments',
      type: natsFlowsPrefixFlowDeployment,
      subject: 'testDeployment.message',
      data: { elementId: 'testResource', test: 123 },
    });
    await publishNatsEvent(loggerMock, nc, event);
    expect(spy).toHaveBeenCalledTimes(1);
    await flowApp.destroy();
    await nc.close();
  });
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  @InputStream()
  public default(event: FlowEvent) {}

  public onMessage = (msg) => {};
}

@FlowModule({
  name: 'test-module',
  declarations: [TestResource],
})
class TestModule {}
