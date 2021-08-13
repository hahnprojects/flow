import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { join } from 'path';

describe('Flow RPC long running task', () => {
  let flowApp: FlowApplication;

  beforeAll(async () => {
    const flow = {
      elements: [{ id: 'testResource', module: 'test.module', functionFqn: 'test.resource.TestResource' }],
      connections: [{ id: 'testConnection1', source: 'testTrigger', sourceStream: 'a', target: 'testResource', targetStream: 'a' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    const amqpConnection = new AmqpConnection({ uri: 'amqp://localhost' });
    await amqpConnection.init();
    flowApp = new FlowApplication([TestModule], flow, null, amqpConnection, true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  test('FLOW.LRPC.1 rpc long running task', (done) => {
    flowApp.subscribe('testResource.a', {
      next: (event: FlowEvent) => {
        console.log(event.getData());
        expect(event.getData()).toBeDefined();
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}, 'a'));
  }, 250000);
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  constructor(context) {
    super(context);
    this.runPyRpcScript(join(__dirname, 'long-rpc.test.py'));
  }

  @InputStream('a')
  public async onA(event) {
    this.callRpcFunction('testA')
      .then((res: any) => this.emitOutput(res, 'a'))
      .catch((err) => this.logger.error(err));
  }
}

@FlowModule({
  name: 'test.module',
  declarations: [TestResource],
})
class TestModule {}
