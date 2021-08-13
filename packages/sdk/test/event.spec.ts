import { FlowEvent } from '../lib';

describe('Events', () => {
  test('FLOW.EVE.1 test logging of events', () => {
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
    expect(event.data).toEqual({});
    expect(event.datacontenttype).toEqual('application/json');

    event = createEvent(null);
    expect(event.data).toEqual({});
    expect(event.datacontenttype).toEqual('application/json');

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
  });

  test('FLOW.EVE.2 test imutability of event data', () => {
    let data;
    let event;
    let eventData;

    data = { test: 'abc' };
    event = new FlowEvent({ id: 'test' }, data);
    expect(event.getData()).toEqual(data);
    data.test = 'xyz';
    expect(event.getData()).not.toEqual(data);
    expect(event.getData()).toEqual({ ...data, test: 'abc' });

    data = { test: 'abc', x: { y: 'z' } };
    event = new FlowEvent({ id: 'test' }, data);
    expect(event.getData()).toEqual(data);
    data.test = 'xyz';
    data.x.y = 'A';
    expect(event.getData()).not.toEqual(data);
    expect(event.getData()).toEqual({ test: 'abc', x: { y: 'z' } });

    data = 'foo';
    event = new FlowEvent({ id: 'test' }, data);
    expect(event.getData()).toEqual(data);
    data = 'bar';
    expect(event.getData()).not.toEqual(data);
    expect(event.getData()).toEqual('foo');

    data = { test: 'abc' };
    event = new FlowEvent({ id: 'test' }, data);
    eventData = event.getData();
    expect(eventData).toEqual(data);
    data.test = 'xyz';
    expect(eventData).not.toEqual(data);
    expect(eventData).toEqual({ test: 'abc' });

    data = { test: 'abc' };
    event = new FlowEvent({ id: 'test' }, data);
    eventData = event.getData();
    expect(eventData).toEqual(data);
    eventData.test = 'xyz';
    expect(eventData).not.toEqual(data);
    expect(eventData).toEqual({ test: 'xyz' });
    expect(event.getData()).toEqual({ test: 'abc' });
    expect(data).toEqual({ test: 'abc' });

    data = {};
    event = new FlowEvent({ id: 'test' }, data);
    expect(event.getData()).toEqual({});

    data = null;
    event = new FlowEvent({ id: 'test' }, data);
    expect(event.getData()).toEqual({});

    data = undefined;
    event = new FlowEvent({ id: 'test' }, data);
    expect(event.getData()).toEqual({});
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
