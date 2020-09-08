import { FlowEvent } from '../src';

describe('Logging', () => {
  test('test logging of events', async (done) => {
    let event;

    event = createEvent('test');
    expect(event.data).toEqual('test');
    expect(event.datacontenttype).toEqual('text/plain');

    event = createEvent('{ hello }');
    expect(event.data).toEqual('{ hello }');
    expect(event.datacontenttype).toEqual('text/plain');

    event = createEvent('{ "hello": "world" }');
    expect(event.data).toEqual({ hello: 'world' });
    expect(event.datacontenttype).toEqual('application/json');

    event = createEvent('[0, 1, 2, 3]');
    expect(event.data).toEqual([0, 1, 2, 3]);
    expect(event.datacontenttype).toEqual('application/json');

    event = createEvent('["a", "b", "c"]');
    expect(event.data).toEqual(['a', 'b', 'c']);
    expect(event.datacontenttype).toEqual('application/json');

    event = createEvent('[{ "hello": "world" }]');
    expect(event.data).toEqual([{ hello: 'world' }]);
    expect(event.datacontenttype).toEqual('application/json');

    event = createEvent('true');
    expect(event.data).toEqual(true);
    expect(event.datacontenttype).toEqual('application/json');

    event = createEvent('null');
    expect(event.data).toEqual(null);
    expect(event.datacontenttype).toEqual('application/json');

    event = createEvent(42);
    expect(event.data).toEqual('42');
    expect(event.datacontenttype).toEqual('text/plain');

    event = createEvent(true);
    expect(event.data).toEqual('true');
    expect(event.datacontenttype).toEqual('text/plain');

    event = createEvent(false);
    expect(event.data).toEqual('false');
    expect(event.datacontenttype).toEqual('text/plain');

    event = createEvent(undefined);
    expect(event.data).toEqual('undefined');
    expect(event.datacontenttype).toEqual('text/plain');

    event = createEvent(null);
    expect(event.data).toEqual('null');
    expect(event.datacontenttype).toEqual('text/plain');

    event = createEvent(NaN);
    expect(event.data).toEqual('NaN');
    expect(event.datacontenttype).toEqual('text/plain');

    event = createEvent({ test: 123 });
    expect(event.data).toEqual({ test: 123 });
    expect(event.datacontenttype).toEqual('application/json');

    event = createEvent({ test: 'abc', nested: { foo: 'bar' } });
    expect(event.data.test).toEqual('abc');
    expect(event.data.nested.foo).toEqual('bar');
    expect(event.datacontenttype).toEqual('application/json');

    const testInst = new TestClass();
    testInst.stringProp = 'abc';
    testInst.numProp = 42;
    testInst.boolProp = false;
    event = createEvent(testInst);
    expect(event.data).toEqual({ stringProp: 'abc', numProp: 42, boolProp: false });
    expect(event.datacontenttype).toEqual('application/json');

    event = createEvent(new Error('err'));
    expect(event.data.message).toEqual('err');
    expect(event.data.stack).toBeDefined();
    expect(typeof event.data.stack).toBe('string');
    expect(event.datacontenttype).toEqual('application/json');

    done();
  });
});

function createEvent(message: any) {
  const event = new FlowEvent({ id: 'test' }, message);
  return JSON.parse(JSON.stringify(event.format()));
}

class TestClass {
  stringProp: string;
  numProp: number;
  boolProp: boolean;
}
