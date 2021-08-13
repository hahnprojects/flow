import { prepareTsFile } from '../lib/cli';

describe('prepare ts-file for schema extraction', () => {
  test('CLI.PTF.1 should add import and console-log', () => {
    const result = prepareTsFile('');
    expect(result).toContain("import { validationMetadatasToSchemas as v } from 'class-validator-jsonschema';");
    expect(result).toContain("import { defaultMetadataStorage } from 'class-transformer/storage'");
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
      classTransformerMetadataStorage: defaultMetadataStorage\n
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
