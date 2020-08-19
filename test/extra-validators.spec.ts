import { validate } from 'class-validator';
import { IncompatableWith } from '../src/extra-validators';

class Test {
  @IncompatableWith(['test2'])
  test1: string;

  @IncompatableWith(['test1'])
  test2: string;
}

class Test2 {
  @IncompatableWith(['test2', 'test3'])
  test1: string;

  @IncompatableWith(['test1'])
  test2: string;

  @IncompatableWith(['test1'])
  test3: string;
}

describe('extra validators', () => {
  test('should work when no incompatible field is present', (done) => {
    const test = new Test();
    test.test1 = 'test';
    validate(test).then((errors) => {
      expect(errors.length).toEqual(0);
      done();
    });
  });

  test('validation should fail when incompatible fields are present', (done) => {
    const test = new Test();
    test.test1 = 'test';
    test.test2 = 'test';
    validate(test).then((errors) => {
      expect(errors.length).toEqual(2);
      done();
    });
  });

  test('validation should work with multiple incompatible fields', (done) => {
    const test = new Test2();
    test.test1 = 'test';
    validate(test).then((errors) => {
      expect(errors.length).toEqual(0);
      done();
    });
  });

  test('validation should fail when multiple incompatible fields are present', (done) => {
    const test = new Test2();
    test.test1 = 'test';
    test.test2 = 'test';
    validate(test).then((errors) => {
      expect(errors.length).toEqual(2);
    });

    const test2 = new Test2();
    test2.test1 = 'test';
    test2.test3 = 'test';
    validate(test2).then((errors) => {
      expect(errors.length).toEqual(2);
    });

    const test3 = new Test2();
    test3.test2 = 'test';
    test3.test3 = 'test';
    validate(test3).then((errors) => {
      expect(errors.length).toEqual(0);
      done();
    });
  });
});
