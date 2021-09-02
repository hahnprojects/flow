import {
  defaultAMQPConnectionOptions,
  FlowApplication,
  FlowEvent,
  FlowFunction,
  FlowModule,
  FlowResource,
  InputStream,
} from '../lib';
import { join } from 'path';
import { PythonShell } from 'python-shell';

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
    flowApp = new FlowApplication([TestModule], flow, null, defaultAMQPConnectionOptions, true);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }, 15000);

  test('FLOW.LRPC.1 rpc long running task', (done) => {
    flowApp.subscribe('testResource.a', {
      next: (event: FlowEvent) => {
        console.log(event.getData());
        expect(event.getData()).toBe('test');
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}, 'a'));
  }, 250000);

  afterAll(async () => {
    await flowApp.destroy();
  });
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  private shell: PythonShell;
  constructor(context) {
    super(context);
    this.shell = this.runPyRpcScript(join(__dirname, 'long-rpc.test.py'));
  }

  @InputStream('a')
  public async onA(event) {
    this.callRpcFunction('testA')
      .then((res: any) => this.emitOutput(res, 'a'))
      .catch((err) => this.logger.error(err));
  }

  public onDestroy = () => {
    this.shell.kill();
  };
}

@FlowModule({
  name: 'test.module',
  declarations: [TestResource],
})
class TestModule {}
