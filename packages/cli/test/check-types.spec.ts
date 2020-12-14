import { checkTypes } from '../lib/cli';

describe('check types', () => {
  test('should handle schemas with stock types', () => {
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

  test('should handle schemas with HPC types', () => {
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

  test('should handle schemas with custom types', () => {
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

  test('should not handle schemas with custom types if the type is not defined', () => {
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
      ),
    ).toBeFalsy();
  });
});
