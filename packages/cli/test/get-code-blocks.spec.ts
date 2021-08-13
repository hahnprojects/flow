import { getCodeBlocks } from '../lib/cli';

describe('getCodeBlocks', () => {
  test('CLI.GCB.1 should extract complete code blocks from string', () => {
    const result = getCodeBlocks('{}\n{}');
    expect(result.length).toBe(2);
  });

  test('CLI.GCB.2 should include line before block', () => {
    const result = getCodeBlocks('class test {}\nclass test1 {}');
    expect(result.length).toBe(2);
    expect(result[0]).toBe('class test {}');
    expect(result[1]).toBe('\nclass test1 {}');
  });

  test('CLI.GCB.3 should not include inner blocks', () => {
    const result = getCodeBlocks('{ {} }');
    expect(result.length).toBe(1);
    expect(result[0]).toBe('{ {} }');
  });
});
