import { handleConvertedOutput } from '../lib/cli';

describe('handle converted output form ts-node', () => {
  test('', () => {
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
    const result = handleConvertedOutput(output, '', json);
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
