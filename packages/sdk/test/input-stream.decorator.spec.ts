import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, FlowTask, InputStream } from '../lib';

describe('InputStreamDecorator', () => {
  test('FLOW.ISD.1 should return input event data', async () => {
    const testRes = new TestResource({ id: 'test' });
    const result = await testRes.onDefaultRessource(new FlowEvent({ id: '1' }, { test1: 'data', test2: 'otherData' }));

    const data = result.getData();
    expect(data.test1).toBeDefined();
    expect(data.test2).toBeDefined();
    expect(data.hello).toBeDefined();
  }, 60000);

  test('FLOW.ISD.2 should not return input event data if stopPropagation is set', async () => {
    const testRes = new TestResourceNoProp({ id: 'test' });
    const result = await testRes.onDefaultNoProp(new FlowEvent({ id: '1' }, { test1: 'data' }));

    const data = result.getData();
    expect(data.test1).toBeUndefined();
    expect(data.hello).toBeDefined();
  }, 60000);

  test('FLOW.ISD.3 should overwrite input event data', async () => {
    const testRes = new TestResource({ id: 'test' });
    const result = await testRes.onDefaultRessource(new FlowEvent({ id: '1' }, { test1: 'data', hello: 'otherData' }));

    const data = result.getData();

    expect(data.test1).toBeDefined();
    expect(data.hello).toBeDefined();
    expect(data.hello).toEqual('world');
  }, 60000);

  test('FLOW.ISD.4 should return input event data in a flow', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'testResource', module: 'test-module', functionFqn: 'test.resource.TestResource' },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
    };
    const flowApp = new FlowApplication([TestModule], flow, null, null, true);
    flowApp.subscribe('testResource.default', {
      next: (event: FlowEvent) => {
        const data = event.getData();
        expect(data.test1).toBeDefined();
        expect(data.test2).toBeDefined();
        expect(data.hello).toBeDefined();

        done();
      },
    });
    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, { test1: 'data', test2: 'otherData' }));
  }, 60000);

  test('FLOW.ISD.5 should only log partial events', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'testResource', module: 'test-module', functionFqn: 'test.resource.TestResource' },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
    };
    const amqpConnection: any = { createSubscriber: jest.fn(), publish: jest.fn(), managedChannel: { assertExchange: jest.fn() } };
    const flowApp = new FlowApplication([TestModule], flow, null, amqpConnection, true);
    const spyInstance = jest.spyOn(amqpConnection, 'publish').mockImplementation((exchange: string, routingKey: string, message: any) => {
      return Promise.resolve();
    });

    flowApp.subscribe('testResource.default', {
      next: async (event: FlowEvent) => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          expect(spyInstance).toHaveBeenLastCalledWith('flowlogs', '', expect.objectContaining({ data: { hello: 'world' } }));
          expect(spyInstance).toHaveBeenCalledWith('flowlogs', '', expect.objectContaining({ data: { test1: 'data' } }));
          expect(spyInstance).toHaveBeenCalledWith('flowlogs', '', expect.objectContaining({ data: 'Flow Deployment is running' }));
          expect(spyInstance).toHaveBeenCalledTimes(3);
          done();
        } catch (error) {
          done(error);
        }
      },
    });
    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, { test1: 'data' }));
  });

  test('FLOW.ISD.6 stopPropagation should work in a mixed flow', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'testTask1', module: 'test-module', functionFqn: 'test.task.task1' },
        { id: 'testTask2', module: 'test-module', functionFqn: 'test.task.task2' },
        { id: 'testRessource', module: 'test-module', functionFqn: 'test.resource.TestResource' },
      ],
      connections: [
        { id: 'c1', source: 'testTrigger', target: 'testTask1' },
        { id: 'c2', source: 'testTask1', target: 'testTask2' },
        { id: 'c3', source: 'testTask2', target: 'testRessource' },
      ],
    };
    const flowApp = new FlowApplication([TestModule], flow, null, null, true);
    flowApp.subscribe('testTask1.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ input: 'data', task1: 'test' });
      },
    });
    flowApp.subscribe('testTask2.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ task2: 'test' });
      },
    });
    flowApp.subscribe('testRessource.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ task2: 'test', hello: 'world' });
        done();
      },
    });
    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, { input: 'data' }));
  }, 20000);

  test('FLOW.ISD.7 stopPropagation should work in a mixed function', async () => {
    const testRes = new TestResource({ id: 'test' });

    let result = await testRes.onDefaultRessource(new FlowEvent({ id: '1' }, { baz: 42 }));
    expect(result.getData()).toEqual({ baz: 42, hello: 'world' });

    result = await testRes.onNotDefault(new FlowEvent({ id: '2' }, { baz: 42 }));
    expect(result.getData()).toEqual({ foo: 'bar' });
  });

  test('FLOW.ISD.8 event propagation should work for parallel events', (done) => {
    const task = new LongRunningTask({ id: 'test' });

    task.onB(new FlowEvent({ id: '2' }, { input: 'b' })).then((r) => {
      expect(r.getData()).toEqual({ input: 'b', output: 'b' });
      done();
    });

    task.onA(new FlowEvent({ id: '1' }, { input: 'a' })).then((r) => {
      expect(r.getData()).toEqual({ input: 'a', output: 'a' });
    });
  });

  test('FLOW.ISD.9 arrow functions should work', async () => {
    const task = new Arrow({ id: 'test' });
    const result = await task.onDefault(new FlowEvent({ id: '2' }, { x: 23, y: 19 }));
    expect(result.getData()).toEqual({ x: 23, y: 19, z: 42 });
  });

  test('FLOW.ISD.10 test single function with multiple streams with different configs', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'testTask1', module: 'test-module', functionFqn: 'test.task.multi' },
      ],
      connections: [
        { id: 'c1', source: 'testTrigger', target: 'testTask1', targetStream: 'default' },
        { id: 'c2', source: 'testTrigger', target: 'testTask1', targetStream: 'other' },
      ],
    };
    const flowApp = new FlowApplication([TestModule], flow, null, null, true);

    let bothDone = false;
    flowApp.subscribe('testTask1.default', {
      next: (event: FlowEvent) => {
        const data = event.getData();
        expect(data.default).toEqual('test');
        expect(data.input).toBeUndefined();
        if (bothDone) {
          done();
        } else {
          bothDone = true;
        }
      },
    });
    flowApp.subscribe('testTask1.other', {
      next: (event: FlowEvent) => {
        const data = event.getData();
        expect(data.input).toEqual('data');
        expect(data.other).toEqual('test');
        if (bothDone) {
          done();
        } else {
          bothDone = true;
        }
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, { input: 'data' }));
  });

  test('FLOW.ISD.11 stateful function should update state correctly', async () => {
    const stateful = new Stateful({ id: 'stateful' });

    expect(stateful.prop).toEqual(0);
    await stateful.onDefault(new FlowEvent({ id: 'test1' }, {}));
    expect(stateful.prop).toEqual(1);
    await stateful.onDefault(new FlowEvent({ id: 'test2' }, {}));
    expect(stateful.prop).toEqual(2);
  });

  test('FLOW.ISD.12 stateful function should work in flow', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'stateful', module: 'test-module', functionFqn: 'test.task.stateful' },
      ],
      connections: [{ id: 'c1', source: 'testTrigger', target: 'stateful' }],
    };
    const flowApp = new FlowApplication([TestModule], flow, null, null, true);

    let count = 0;
    flowApp.subscribe('stateful.default', {
      next: (event: FlowEvent) => {
        const data = event.getData();
        expect(data.prop).toEqual(count++);

        if (count === 3) {
          done();
        }
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));

    setTimeout(() => {
      flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
      // no waiting...
      flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
    }, 100);
  });

  test('FLOW.ISD.13 deprecated should still work as expected', () => {
    const deprecated = new Deprecated({ id: 'dep' });
    const event1 = deprecated.onDefault(new FlowEvent({ id: 'test' }, { test: 42 }));

    expect(event1.getData()).toEqual({ hello: 'world' });
  });
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  @InputStream('default')
  public async onDefaultRessource(event: FlowEvent) {
    return this.emitEvent({ hello: 'world' }, event);
  }

  @InputStream('notdefault', { stopPropagation: true })
  public async onNotDefault(event: FlowEvent) {
    return this.emitEvent({ foo: 'bar' }, event);
  }
}

@FlowFunction('test.resource.LongRunningTask')
class LongRunningTask extends FlowTask {
  @InputStream('a')
  public async onA(event: FlowEvent) {
    return this.emitEvent({ output: 'a' }, event);
  }

  @InputStream('b')
  public async onB(event: FlowEvent) {
    await setTimeout(() => Promise.resolve(), 100);
    return this.emitEvent({ output: 'b' }, event);
  }
}

@FlowFunction('test.task.arrow')
class Arrow extends FlowTask {
  @InputStream()
  public async onDefault(event: FlowEvent) {
    const data = event.getData();
    return this.calcSomething(data.x, data.y, event);
  }

  private calcSomething = (x = 0, y = 0, event) => this.emitEvent({ z: x + y }, event);
}

@FlowFunction('test.resource.TestResourceNoProp')
class TestResourceNoProp extends FlowResource {
  @InputStream('default', { stopPropagation: true })
  public async onDefaultNoProp(event: FlowEvent) {
    return this.emitEvent({ hello: 'world' }, event);
  }
}

@FlowFunction('test.task.task1')
class TestTask1 extends FlowTask {
  @InputStream('default')
  public async onDefaultTask1(event: FlowEvent) {
    return this.emitEvent({ task1: 'test' }, event);
  }
}

@FlowFunction('test.task.task2')
class TestTask2 extends FlowTask {
  @InputStream('default', { stopPropagation: true })
  public async onDefaultTask2(event: FlowEvent) {
    return this.emitEvent({ task2: 'test' }, event);
  }
}

@FlowFunction('test.task.multi')
class MultiStream extends FlowTask {
  @InputStream('default', { stopPropagation: true })
  public async onDefault(event: FlowEvent) {
    return this.emitEvent({ default: 'test' }, event, 'default');
  }

  @InputStream('other')
  public async onOther(event: FlowEvent) {
    return this.emitEvent({ other: 'test' }, event, 'other');
  }
}

@FlowFunction('test.task.stateful')
class Stateful extends FlowTask {
  public prop = 0;

  @InputStream('default')
  public async onDefault(event: FlowEvent) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return this.emitEvent({ prop: this.prop++ }, event);
  }
}

@FlowFunction('test.task.use-deprecated')
class Deprecated extends FlowTask {
  @InputStream()
  public onDefault(event: FlowEvent) {
    return this.emitOutput({ hello: 'world' });
  }
}

@FlowModule({
  name: 'test-module',
  declarations: [TestResource, TestResourceNoProp, TestTask1, TestTask2, MultiStream, Stateful],
})
class TestModule {}
