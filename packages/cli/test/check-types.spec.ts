import { checkTypes } from '../lib/cli';

const chalk = require('chalk');
jest.mock('chalk', () => ({
  blue: jest.fn(),
  green: jest.fn(),
  yellow: jest.fn(),
  red: jest.fn(),
  bold: {
    green: jest.fn(),
    red: jest.fn(),
  },
}));

/* eslint-disable no-console */
describe('check types', () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

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
      ),
    ).toBeFalsy();

    expect(chalk.bold.red).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledTimes(1);
  });
});
