import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';
import { join } from 'path';
import type { PythonShell } from 'python-shell';
import { setTimeout } from 'timers/promises';

describe('Flow RPC long running task', () => {
  let flowApp: FlowApplication;

  beforeAll(async () => {
    const flow = {
      elements: [{ id: 'testResource', module: 'test-module', functionFqn: 'test.resource.TestResource' }],
      connections: [{ id: 'testConnection1', source: 'testTrigger', sourceStream: 'a', target: 'testResource', targetStream: 'a' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    flowApp = new FlowApplication([TestModule], flow, { amqpConfig: {}, skipApi: true });
    await setTimeout(2000);
  });

  test('FLOW.LRPC.1 rpc long running task', (done) => {
    flowApp.subscribe('testResource.a', {
      next: async (event: FlowEvent) => {
        expect(event.getData()).toBeDefined();
        await flowApp.destroy();
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}, 'a'));
  }, 250000);
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  private shell: PythonShell;

  constructor(context) {
    super(context);
    this.shell = this.runPyRpcScript(join(__dirname, 'long-rpc.test.py'));
  }

  onDestroy = () => this.shell.kill();

  @InputStream('a')
  public async onA(event) {
    this.callRpcFunction('testA')
      .then((res: any) => this.emitEvent(res, event, 'a'))
      .catch((err) => this.logger.error(err));
  }
}

@FlowModule({
  name: 'test-module',
  declarations: [TestResource],
})
class TestModule {}
