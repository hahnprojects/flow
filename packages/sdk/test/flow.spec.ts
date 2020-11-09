import { IsNumber } from 'class-validator';

import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, FlowTask, InputStream, delay } from '../lib';

// tslint:disable:no-console
describe('Flow Application', () => {
  test('Simple Flow Application with Long Running Task', async (done) => {
    const size = 8;
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource' },
        { id: 'testResource', module: 'test.module', functionFqn: 'test.resource.TestResource' },
        { id: 'longRunningTask', module: 'test.module', functionFqn: 'test.task.LongRunningTask', properties: { delay: 500 } },
      ],
      connections: [
        { id: 'testConnection1', source: 'testTrigger', target: 'testResource' },
        { id: 'testConnection2', source: 'testResource', target: 'longRunningTask' },
      ],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    const flowApp = new FlowApplication([TestModule], flow, null, null, true);

    flowApp.subscribe('testResource.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ hello: 'world' });
      },
    });

    let count = 0;
    flowApp.subscribe('longRunningTask.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ foo: 'bar' });
        expect(event.getDataContentType()).toBe('application/json');
        expect(event.getSource()).toBe('flows/testFlow/deployments/testDeployment/elements/longRunningTask');
        expect(event.getSubject()).toBe('test.task.LongRunningTask');
        expect(event.getType()).toBe('default');
        expect(event.getTime()).toBeDefined();

        if (++count === size) {
          done();
        }
      },
    });

    for (let i = 0; i < size; i++) {
      flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
    }
  }, 60000);
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  @InputStream('default', { concurrent: 5 })
  public async onDefault(event) {
    return this.emitOutput({ hello: 'world' });
  }
}

@FlowFunction('test.task.LongRunningTask')
class LongRunningTask extends FlowTask<Properties> {
  constructor(context, properties) {
    super(context, properties, Properties);
  }

  @InputStream()
  public async loveMeLongTime(event) {
    await delay(this.properties.delay);
    return this.emitOutput({ foo: 'bar' });
  }
}

class Properties {
  @IsNumber()
  delay: number;
}

@FlowModule({
  name: 'test.module',
  declarations: [LongRunningTask, TestResource],
})
class TestModule {}
