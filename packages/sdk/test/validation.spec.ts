import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

import { FlowFunction, FlowTask } from '../lib';
import { loggerMock } from './mocks/logger.mock';

describe('Property Validation', () => {
  afterEach(() => {
    loggerMock.log.mockReset();
    loggerMock.warn.mockReset();
    loggerMock.error.mockReset();
    jest.restoreAllMocks();
  });

  it('PCKG.FLW.SDK.VLDTN.1 should handle simple validation', () => {
    @FlowFunction('test')
    class Task extends FlowTask<Properties> {
      constructor(context, properties) {
        super(context, properties, Properties);
      }
    }

    class Properties {
      @IsNumber()
      aNumber: number;
    }

    expect(() => new Task({ logger: loggerMock }, { aNumber: 42 })).not.toThrow('Properties Validation failed');

    expect(() => new Task({ logger: loggerMock }, {})).toThrow('Properties Validation failed');
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining(
        'Validation for property "aNumber" failed:\n{"isNumber":"aNumber must be a number conforming to the specified constraints"}\nvalue: undefined',
      ),
      { functionFqn: 'test' },
    );

    expect(() => new Task({ logger: loggerMock }, { aNumber: 'a string' })).toThrow('Properties Validation failed');
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining(
        'Validation for property "aNumber" failed:\n{"isNumber":"aNumber must be a number conforming to the specified constraints"}\nvalue: a string',
      ),
      { functionFqn: 'test' },
    );
  });

  it('PCKG.FLW.SDK.VLDTN.2 should handle array validation', () => {
    @FlowFunction('test')
    class Task extends FlowTask<Properties> {
      constructor(context, properties) {
        super(context, properties, Properties);
      }
    }

    class Properties {
      @IsArray()
      @IsString({ each: true })
      aStringArray: string[];
    }

    expect(() => new Task({ logger: loggerMock }, { aStringArray: [] })).not.toThrow('Properties Validation failed');
    expect(() => new Task({ logger: loggerMock }, { aStringArray: ['foo'] })).not.toThrow('Properties Validation failed');
    expect(() => new Task({ logger: loggerMock }, { aStringArray: ['foo', 'bar'] })).not.toThrow('Properties Validation failed');

    expect(() => new Task({ logger: loggerMock }, {})).toThrow('Properties Validation failed');
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining(
        'Validation for property "aStringArray" failed:\n{"isString":"each value in aStringArray must be a string","isArray":"aStringArray must be an array"}\nvalue: undefined',
      ),
      { functionFqn: 'test' },
    );

    expect(() => new Task({ logger: loggerMock }, { aStringArray: 'foo' })).toThrow('Properties Validation failed');
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining('Validation for property "aStringArray" failed:\n{"isArray":"aStringArray must be an array"}\nvalue: foo'),
      { functionFqn: 'test' },
    );

    expect(() => new Task({ logger: loggerMock }, { aStringArray: ['foo', 42] })).toThrow('Properties Validation failed');
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining(
        'Validation for property "aStringArray" failed:\n{"isString":"each value in aStringArray must be a string"}\nvalue: foo,42',
      ),
      { functionFqn: 'test' },
    );
  });

  it('PCKG.FLW.SDK.VLDTN.3 should handle nested validation', () => {
    @FlowFunction('test')
    class Task extends FlowTask<Properties> {
      constructor(context, properties) {
        super(context, properties, Properties);
      }
    }

    class Nested {
      @IsString()
      aString: string;
    }

    class Properties {
      @Type(() => Nested)
      @ValidateNested()
      nested: Nested;
    }

    expect(() => new Task({ logger: loggerMock }, { nested: { aString: 'foo' } })).not.toThrow('Properties Validation failed');

    expect(() => new Task({ logger: loggerMock }, { nested: {} })).toThrow('Properties Validation failed');
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining(
        'Validation for property "nested.aString" failed:\n{"isString":"aString must be a string"}\nvalue: undefined',
      ),
      { functionFqn: 'test' },
    );

    expect(() => new Task({ logger: loggerMock }, { nested: { aString: 42 } })).toThrow('Properties Validation failed');
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining('Validation for property "nested.aString" failed:\n{"isString":"aString must be a string"}\nvalue: 42'),
      { functionFqn: 'test' },
    );
  });

  it('PCKG.FLW.SDK.VLDTN.4 should handle arrays with nested validation', () => {
    @FlowFunction('test')
    class Task extends FlowTask<Properties> {
      constructor(context, properties) {
        super(context, properties, Properties);
      }
    }

    class Nested {
      @IsString()
      aString: string;
    }

    class Properties {
      @IsArray()
      @Type(() => Nested)
      @ValidateNested({ each: true })
      nested: Nested[];
    }

    expect(() => new Task({ logger: loggerMock }, { nested: [] })).not.toThrow('Properties Validation failed');
    expect(() => new Task({ logger: loggerMock }, { nested: [{ aString: 'foo' }] })).not.toThrow('Properties Validation failed');

    expect(() => new Task({ logger: loggerMock }, { nested: [{}] })).toThrow('Properties Validation failed');
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining(
        'Validation for property "nested.0.aString" failed:\n{"isString":"aString must be a string"}\nvalue: undefined',
      ),
      { functionFqn: 'test' },
    );

    expect(() => new Task({ logger: loggerMock }, { nested: 42 })).toThrow('Properties Validation failed');
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining(
        'Validation for property "nested" failed:\n{"isArray":"nested must be an array","nestedValidation":"each value in nested property nested must be either object or array"}\nvalue: 42',
      ),
      { functionFqn: 'test' },
    );
    expect(() => new Task({ logger: loggerMock }, {})).toThrow('Properties Validation failed');
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining('Validation for property "nested" failed:\n{"isArray":"nested must be an array"}\nvalue: undefined'),
      { functionFqn: 'test' },
    );

    expect(() => new Task({ logger: loggerMock }, { nested: [{ aString: 42 }] })).toThrow('Properties Validation failed');
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining('Validation for property "nested.0.aString" failed:\n{"isString":"aString must be a string"}\nvalue: 42'),
      { functionFqn: 'test' },
    );
  });
});
