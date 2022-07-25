import { interval, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

import { delay, FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, FlowTask, InputStream } from '../lib';

/* eslint-disable no-console */
describe('rx', () => {
  test('FLOW.RX.1 rx', (done) => {
    const size = 3;
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource1' },
        { id: 'testResource1', module: 'test-module', functionFqn: 'test.resource.TestResource1' },
        { id: 'testResource2', module: 'test-module', functionFqn: 'test.resource.TestResource2' },
        { id: 'tap', module: 'test-module', functionFqn: 'operators.tap' },
      ],
      connections: [
        { id: 'testConnection1', source: 'testTrigger', target: 'testResource1' },
        { id: 'testConnection2', source: 'testResource1', target: 'testResource2' },
        { id: 'testConnection3', source: 'testResource1', target: 'tap' },
      ],
    };
    const flowApp = new FlowApplication([TestModule], flow, null, null, true);

    flowApp.subscribe('tap.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ hello: 'world' });
      },
    });

    let count = 0;
    flowApp.subscribe('testResource2.default', {
      next: (event: FlowEvent) => {
        count++;
        expect(event.getData()).toEqual(expect.objectContaining({ foo: 'bar' }));
        if (count === size) {
          done();
        }
      },
    });

    const triggers = interval(1000);
    triggers.pipe(take(size)).subscribe((x) => {
      flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
    });
  }, 60000);
});

@FlowFunction('test.resource.TestResource1')
class TestResource extends FlowResource {
  @InputStream('default')
  public async onDefault(event) {
    await delay(2000);
    return this.emitEvent({ hello: 'world' }, event);
  }
}

@FlowFunction('operators.tap')
class Tap extends FlowTask {
  tap$: Subject<FlowEvent>;

  constructor(context) {
    super(context);
    this.tap$ = new Subject<FlowEvent>();
    this.tap$.subscribe({
      next: (event) => {
        this.emitEvent({}, event);
      },
    });
  }

  @InputStream()
  public async onDefault(event) {
    this.tap$.next(event);
  }
}

@FlowFunction('test.resource.TestResource2')
class TestResource2 extends FlowResource {
  @InputStream('default', { concurrent: 1 })
  public async onDefault(event) {
    await delay(1000);
    return this.emitEvent({ foo: 'bar' }, event);
  }
}

@FlowModule({
  name: 'test-module',
  declarations: [TestResource, TestResource2, Tap],
})
class TestModule {}
