import { fillTemplate } from '../lib';

describe('utils', () => {
  test('FLOW.UTIL.1 template string interpolation for flow properties', () => {
    let tmplString = '${test}';
    let tmplVars: any = { test: 'hello world' };
    let filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('hello world');

    tmplString = '${foo.bar}';
    tmplVars = { foo: { bar: 'baz' } };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('baz');

    tmplString = '${path}';
    tmplVars = { path: 'Some.Random.path' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('Some.Random.path');

    tmplString = 'foo';
    tmplVars = { foo: 'bar' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('foo');

    tmplString = '${foo}';
    tmplVars = { foo: 0 };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('0');

    tmplString = '';
    tmplVars = { foo: 'bar' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('');

    tmplString = null;
    tmplVars = null;
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual(null);

    tmplString = '${foo}';
    tmplVars = { foo: 'bar' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('bar');

    tmplString = '4${foo}';
    tmplVars = { foo: 2 };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('42');

    tmplString = '${foo}';
    tmplVars = { foo: 42 };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('42');

    tmplString = '${foo.bar}';
    tmplVars = { foo: { bar: 'baz' } };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('baz');

    tmplString = '${foo}';
    tmplVars = { foo: 'bar', 'a-b': 'x' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('bar');

    tmplString = '${x} ${y} c';
    tmplVars = { x: 'a', y: 'b' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('a b c');

    tmplString = '${x}${y}${z}';
    tmplVars = { x: 'a', z: 'c' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('ac');

    tmplString = '${foo}';
    tmplVars = {};
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual(undefined);

    tmplString = '${foo.bar.baz}';
    tmplVars = {};
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual(undefined);

    tmplString = '${foo}';
    tmplVars = undefined;
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual(undefined);

    tmplString = '${foo}';
    tmplVars = null;
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual(undefined);

    tmplString = 'foo';
    tmplVars = null;
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('foo');
  });

  test('FLOW.UTIL.2 deep interpolation', () => {
    let input: any = { foo: '${bar}' };
    let props: any = { bar: 'baz' };
    let res = fillTemplate(input, props);
    expect(res).toEqual({ foo: 'baz' });

    input = { foo: { x: ['a', 'b', '${bar}'] } };
    props = { bar: 'c' };
    res = fillTemplate(input, props);
    expect(res).toEqual({ foo: { x: ['a', 'b', 'c'] } });

    input = { a: { b: { c: { d: '${x}' } } } };
    props = { x: '42' };
    res = fillTemplate(input, props);
    expect(res).toEqual({ a: { b: { c: { d: '42' } } } });

    input = { a: { b: { c: { d: ['${x}', '${y}'] } } } };
    props = { x: '42', y: '23' };
    res = fillTemplate(input, props);
    expect(res).toEqual({ a: { b: { c: { d: ['42', '23'] } } } });

    input = { foo: [{ a: 'x', b: '${bar}' }, { c: '${baz}' }] };
    props = { bar: 'y', baz: 'z' };
    res = fillTemplate(input, props);
    expect(res).toEqual({ foo: [{ a: 'x', b: 'y' }, { c: 'z' }] });

    input = { foo: { x: ['a', 'b', '${bar}'] } };
    props = {};
    res = fillTemplate(input, props);
    expect(res).toEqual({ foo: { x: ['a', 'b', undefined] } });

    input = { foo: { x: ['a', 'b', '${bar}'] } };
    props = null;
    res = fillTemplate(input, props);
    expect(res).toEqual({ foo: { x: ['a', 'b', undefined] } });
  });

  test('FLOW.UTIL.3 fillTemplate', () => {
    let tmplString = 'foo';
    let tmplVars: any = { foo: 'bar' };
    let filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('foo');

    tmplString = '';
    tmplVars = { foo: 'bar' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('');

    tmplString = null;
    tmplVars = null;
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual(null);

    tmplString = '${foo}';
    tmplVars = { foo: 'bar' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('bar');

    tmplString = '4${foo}';
    tmplVars = { foo: 2 };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('42');

    tmplString = '${foo}';
    tmplVars = { foo: 42 };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('42');

    tmplString = '${foo.bar}';
    tmplVars = { foo: { bar: 'baz' } };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('baz');

    tmplString = '${foo}';
    tmplVars = { foo: 'bar', 'a-b': 'x' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('bar');

    tmplString = '${x} ${y} c';
    tmplVars = { x: 'a', y: 'b' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('a b c');

    tmplString = '${x}${y}${z}';
    tmplVars = { x: 'a', z: 'c' };
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('ac');

    tmplString = '${foo}';
    tmplVars = {};
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual(undefined);

    tmplString = '${foo.bar.baz}';
    tmplVars = {};
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual(undefined);

    tmplString = '${foo}';
    tmplVars = undefined;
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual(undefined);

    tmplString = '${foo}';
    tmplVars = null;
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual(undefined);

    tmplString = 'foo';
    tmplVars = null;
    filled = fillTemplate(tmplString, tmplVars);
    expect(filled).toEqual('foo');
  });
});
