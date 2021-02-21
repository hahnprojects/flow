import { fillTemplate } from '../lib';

describe('utils', () => {
  test('fillTemplate', () => {
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
