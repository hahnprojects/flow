import chalk from 'chalk';
import fs from 'node:fs/promises';
import path from 'node:path';

const defaultLogger = {
  /* eslint-disable no-console */
  log: console.log,
  error: console.error,
  ok: console.info,
  /* eslint-enable no-console */
};

export function checkTypes(definedTypes, propertiesSchema, jsonPath, logger = defaultLogger) {
  const knownTypes = new Set([
    ...definedTypes,
    'string',
    'undefined',
    'number',
    'boolean',
    'any',
    'object',
    'array',
    'integer',
    'Asset',
    'AssetType',
    'Flow',
    'Secret',
    'TimeSeries',
  ]);

  // check if all types are known
  const properties = propertiesSchema.properties || {};
  for (const property of Object.keys(properties)) {
    if (properties[property].type && !knownTypes.has(properties[property].type)) {
      logger.error(
        `ERROR: unknown type ${properties[property].type}.
       Please add a schema for this type in ${jsonPath}
       for more info check the documentation`,
      );
      return false;
    }
  }
  return true;
}

export async function getTypes(filePath) {
  try {
    const json = JSON.parse(await fs.readFile(path.join(process.cwd(), filePath)));
    return json.definitions ? Object.keys(json.definitions) : [];
  } catch {
    return [];
  }
}

export async function handleConvertedOutput(result, jsonPath, json, logger = defaultLogger) {
  let schema;
  try {
    schema = JSON.parse(result);
  } catch {
    logger.error(result);
    return json;
  }

  const values = [
    ['propertiesSchema', 'Properties'],
    ['inputStreams', 'InputProperties'],
    ['outputStreams', 'OutputProperties'],
  ];

  for (const value of values) {
    const propertiesSchema = schema[value[1]] || {};
    for (const requestProperty of propertiesSchema.required || []) {
      propertiesSchema.properties[requestProperty] = { ...propertiesSchema.properties[requestProperty], required: true };
    }
    // remove required field
    delete propertiesSchema.required;

    const types = await getTypes(jsonPath);
    checkTypes(types, propertiesSchema, jsonPath);

    const completeSchema = {
      schema: {
        type: 'object',
        properties: {
          ...propertiesSchema.properties,
        },
      },
    };

    if (value[0] === 'propertiesSchema') {
      if (!json['propertiesSchema']) {
        json['propertiesSchema'] = completeSchema;
      }
    } else {
      // check if config for default input/output stream exists
      if (!json[value[0]].some((v) => v.name === 'default') && propertiesSchema) {
        json[value[0]].push({
          name: 'default',
          ...completeSchema,
        });
      }
    }
  }

  // add definitions
  if (Object.keys(schema).some((key) => !['Properties', 'InputProperties', 'OutputProperties'].includes(key))) {
    const typeDefinitions = Object.keys(schema).filter((key) => !['Properties', 'InputProperties', 'OutputProperties'].includes(key));
    json.definitions = typeDefinitions.reduce((previousValue, currentValue) => {
      const additionalSchema = schema[currentValue];
      for (const requestProperty of additionalSchema.required || []) {
        additionalSchema.properties[requestProperty] = { ...additionalSchema.properties[requestProperty], required: true };
      }
      delete additionalSchema.required;
      previousValue[currentValue] = additionalSchema;
      return previousValue;
    }, {});
  }
  return json;
}

export function prepareTsFile(file) {
  // if a class extends another and does not have its own fields no metadata is generated and so no schema can be generated
  // in this case replace empty block with the block it inherits from
  let codeBlocks = getCodeBlocks(file);
  const emptyExtendsBlock = codeBlocks.find((block) => blockDefinitionIncludes(block, 'extends') && isBlockEmpty(block));
  if (emptyExtendsBlock) {
    // replace block and remove extends
    let replBlock = `${emptyExtendsBlock}`;
    if (replBlock.replace(/\s\s+/g, ' ').trim().startsWith('class OutputProperties')) {
      // remove extends
      replBlock = replBlock.replace('extends InputProperties', '');
      // replace block with InputProperties block
      const inputPropertiesBlock = codeBlocks.find(
        (v) => blockDefinitionIncludes(v, 'InputProperties') && !blockDefinitionIncludes(v, 'OutputProperties'),
      );
      replBlock = replBlock.replace(getBlockContent(replBlock), getBlockContent(inputPropertiesBlock));

      file = file.replace(emptyExtendsBlock, replBlock);
    }
  }
  return (
    `import { validationMetadatasToSchemas as v } from 'class-validator-jsonschema';\n` +
    `import { defaultMetadataStorage as classTransformerDefaultMetadataStorage } from 'class-transformer/cjs/storage';\n` +
    `${file}\n` +
    `const s = v({\n
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
    });\n` +
    `console.log(JSON.stringify(s));`
  );
}

export function getCodeBlocks(string_) {
  const blocks = [];
  let counter = 0;
  let start = 0;
  let lastNewline = 0;
  for (const [index, char] of [...string_].entries()) {
    if (char === '\n') {
      lastNewline = index;
    }
    if (char === '{') {
      if (counter === 0) {
        // first bracket of block
        start = lastNewline;
      }
      counter++;
    } else if (char === '}') {
      counter--;
      if (counter === 0) {
        // last bracket of block
        blocks.push(string_.slice(start, index + 1));
      }
    }
  }
  return blocks;
}

export const logger = {
  /* eslint-disable no-console */
  log: console.log,
  error: (message) => console.log(chalk.bold.red(message)),
  ok: (message) => console.log(chalk.bold.green(message)),
  /* eslint-enable no-console */
};

export function handleApiError(error) {
  if (error.isAxiosError && error.response) {
    logger.error(`${error.response.status} ${error.response.statusText}`);
    if (error.response.data) {
      logger.error(JSON.stringify(error.response.data));
    }
  } else {
    logger.error(error);
  }
}

function blockDefinitionIncludes(block, value) {
  return block.trim().split('\n', 1)[0].includes(value);
}

function getBlockContent(block) {
  return block.slice(block.indexOf('{'), block.lastIndexOf('}') + 1);
}

function isBlockEmpty(block) {
  const blockContent = block.slice(block.indexOf('{') + 1, block.lastIndexOf('}'));
  return !blockContent.trim();
}
