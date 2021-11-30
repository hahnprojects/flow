import { describe, expect, jest, test } from '@jest/globals';

import { checkTypes, getCodeBlocks, handleConvertedOutput, prepareTsFile } from '../lib/utils.mjs';

const logger = {
  log: jest.fn(),
  error: jest.fn(),
  ok: jest.fn(),
};

describe('check types', () => {
  test('CLI.CT.1 should handle schemas with stock types', () => {
    expect(
      checkTypes(
        [],
        {
          properties: {
            num: {
              type: 'number',
              required: true,
            },
            str: {
              type: 'string',
            },
            bool: {
              type: 'boolean',
            },
            any: {
              type: 'any',
            },
            obj: {
              type: 'object',
            },
          },
        },
        '',
      ),
    ).toBeTruthy();
  });

  test('CLI.CT.2 should handle schemas with HPC types', () => {
    expect(
      checkTypes(
        [],
        {
          properties: {
            asset: {
              type: 'Asset',
            },
            flow: {
              type: 'Flow',
            },
            secret: {
              type: 'Secret',
            },
            timeseries: {
              type: 'TimeSeries',
            },
            assetType: {
              type: 'AssetType',
            },
          },
        },
        '',
      ),
    ).toBeTruthy();
  });

  test('CLI.CT.2 should handle schemas with custom types', () => {
    expect(
      checkTypes(
        ['CustomType'],
        {
          properties: {
            custom: {
              type: 'CustomType',
            },
          },
        },
        '',
      ),
    ).toBeTruthy();
  });

  test('CLI.CT.3 should not handle schemas with custom types if the type is not defined', () => {
    expect(
      checkTypes(
        [],
        {
          properties: {
            custom: {
              type: 'CustomType',
            },
          },
        },
        '',
        logger,
      ),
    ).toBeFalsy();

    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});

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

describe('handle converted output form ts-node', () => {
  test('CLI.HCO.1', async () => {
    const output =
      '{"Properties":{"properties":{"num":{"type":"number"}},"type":"object","required":["num"]},"InputProperties":{"properties":{"num":{"type":"number"}},"type":"object","required":["num"]},"OutputProperties":{"properties":{"num":{"type":"number"}},"type":"object","required":["num"]}}';

    const json = {
      fqn: 'example.tasks.ModifySomething',
      category: 'task',
      name: 'ModifySomething',
      description: '',
      isAbstract: false,
      supertype: '',
      propertiesSchema: {
        schema: {
          type: 'object',
          properties: {
            num: {
              type: 'number',
              required: true,
            },
          },
        },
      },
      inputStreams: [],
      outputStreams: [],
      tags: [],
    };
    const result = await handleConvertedOutput(output, '', json);
    expect(result['inputStreams']).toEqual([
      {
        name: 'default',
        schema: {
          type: 'object',
          properties: {
            num: {
              type: 'number',
              required: true,
            },
          },
        },
      },
    ]);
    expect(result['outputStreams']).toEqual([
      {
        name: 'default',
        schema: {
          type: 'object',
          properties: {
            num: {
              type: 'number',
              required: true,
            },
          },
        },
      },
    ]);
  });
});

describe('prepare ts-file for schema extraction', () => {
  test('CLI.PTF.1 should add import and console-log', () => {
    const result = prepareTsFile('');
    expect(result).toContain("import { validationMetadatasToSchemas as v } from 'class-validator-jsonschema';");
    expect(result).toContain(
      "import { defaultMetadataStorage as classTransformerDefaultMetadataStorage } from 'class-transformer/cjs/storage'",
    );
    expect(result).toContain(`const s = v({\n
      additionalConverters: {\n
        UnitArgsValidator: (meta) => {\n
          return {\n
            measure: meta.constraints[0],\n
            unit: meta.constraints[1],\n
            type: 'number',\n
          };\n
        },\n
      },\n
      classTransformerMetadataStorage\n
    });\n`);
    expect(result).toContain('console.log(JSON.stringify(s));');
  });

  test('CLI.PTF.2 should replace empty extends blocks', () => {
    const result = prepareTsFile(
      'class InputProperties {\n' +
        '  @IsNumber()\n' +
        '  num: number;\n' +
        '}\n' +
        '\n' +
        'class OutputProperties extends InputProperties {}',
    );

    expect(result).not.toContain('extends');
    expect(result).not.toContain('{}');
    expect(result).toContain('num: number;');
  });
});
