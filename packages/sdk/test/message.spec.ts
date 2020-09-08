import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';

// tslint:disable:no-console
describe('Flow SDK', () => {
  test('publish message', async (done) => {
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
    const flowApp = new FlowApplication([TestModule], flow);

    flowApp.subscribe('testResource.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ test: 123 });
        done();
      },
    });

    flowApp.publishMessage({ test: 123 }, 'testResource');
  }, 60000);
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  @InputStream('default')
  public async onDefault(event) {
    return this.emitOutput({ hello: 'world' });
  }

  public handleMessage = (msg) => {
    this.emitOutput(msg);
  };
}

@FlowModule({
  name: 'test.module',
  declarations: [TestResource],
})
class TestModule {}
