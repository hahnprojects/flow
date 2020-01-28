import { IsNumber } from 'class-validator';

import { delay, FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, FlowTask, InputStream } from '../src';

// tslint:disable:no-console
describe('Flow Application', () => {
  test('Simple Flow Application with Long Running Task', async (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource' },
        { id: 'testResource', module: 'test.module', functionFqn: 'test.resource.TestResource' },
        { id: 'longRunningTask', module: 'test.module', functionFqn: 'test.task.LongRunningTask', properties: { delay: 1000 } },
      ],
      connections: [
        { id: 'testConnection1', source: 'testTrigger', target: 'testResource' },
        { id: 'testConnection2', source: 'testResource', target: 'longRunningTask' },
      ],
    };
    const flowApp = new FlowApplication([TestModule], flow);

    flowApp.addListener('testResource.default', (event: FlowEvent) => {
      expect(event.getData()).toEqual({ hello: 'world' });
    });
    flowApp.addListener('longRunningTask.default', (event: FlowEvent) => {
      expect(event.getData()).toEqual({ foo: 'bar' });
      const stats = flowApp.getQueueStats();
      console.log(stats);
      if (stats['longRunningTask'].size === 0) {
        done();
      }
    });

    for (let i = 0; i < 10; i++) {
      flowApp.emit('testTrigger.default', null);
    }
  }, 60000);
});

@FlowFunction('test.resource.TestResource', { concurrent: 5 })
class TestResource extends FlowResource {
  @InputStream('default')
  public async onDefault(event) {
    return this.emitOutput({ hello: 'world' });
  }
}

@FlowFunction('test.task.LongRunningTask')
class LongRunningTask extends FlowTask {
  private properties: Properties;

  constructor(context, properties: unknown) {
    super(context);
    this.properties = this.validateProperties(Properties, properties);
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
