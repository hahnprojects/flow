import { IsVoltage } from '../lib/unit-decorators';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { computeUnitOptions, verifyUnit } from '../lib/unit-utils';

class Test {
  @IsVoltage('YV')
  arg: number;
}

describe('unit decorators', () => {
  test('FLOW.UD.1 voltage', async () => {
    const schemas = validationMetadatasToSchemas({
      additionalConverters: {
        UnitArgsValidator: (meta) => {
          return {
            measure: meta.constraints[0],
            unit: meta.constraints[1],
            type: 'number',
          };
        },
      },
    });

    expect(schemas['Test'].properties.arg).toEqual({
      measure: 'voltage',
      unit: 'YV',
      type: 'number',
    });
  });

  test('FLOW.UD.2 verifyUnit', () => {
    expect(verifyUnit('in', 'length')).toEqual(1 / 39.3701);
    expect(verifyUnit('kNcm', 'torque')).toEqual(10);
    expect(verifyUnit('m/s', 'translationalVelocity')).toEqual(1);
    expect(verifyUnit('km/h', 'translationalVelocity')).toEqual(0.2777777777777778);
    expect(verifyUnit('kgm^2/s^2', 'torque')).toEqual(1);
    expect(verifyUnit('kgkm^2/s^2', 'torque')).toEqual(1e6);
    expect(verifyUnit('1/s', 'electricalFrequency')).toEqual(1);
    expect(verifyUnit('kHz', 'electricalFrequency')).toEqual(1000);
    expect(verifyUnit('W/m^2K', 'thermalTransmittance')).toEqual(1);
    expect(verifyUnit('Btu/hft^2F', 'thermalTransmittance')).toBeCloseTo(5.678);
    expect(verifyUnit('J/hm^2K', 'thermalTransmittance')).toEqual(1 / 3600);
    expect(verifyUnit('ft^2', 'area')).toBeCloseTo(0.0929);

    expect(verifyUnit('in', 'time')).toEqual(-1);
    expect(verifyUnit('kNmmm', 'torque')).toEqual(-1);

    expect(verifyUnit('', 'time')).toEqual(-1);
    expect(verifyUnit('min', '')).toEqual(-1);
    expect(verifyUnit('', '')).toEqual(-1);
  });

  test('FLOW.UD.3 computeUnits', () => {
    expect(computeUnitOptions('L-2')).toEqual(computeUnitOptions('L2'));
  });
});
