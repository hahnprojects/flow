import {
  isNumber,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { dimensionToUnitMap, units } from './units';

export function makeUnitDecorator(unit: string, metric: string, validationOptions?: ValidationOptions) {
  const conversionFactor = verifyUnit(unit, metric);
  if (conversionFactor < 0) throw `${unit} is not a valid ${metric}.`;
  return (object: any, propertyName: string) => {
    Reflect.defineMetadata(`conversionFactor:${propertyName}`, conversionFactor, object.constructor);
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [metric, unit],
      validator: UnitArgsValidator,
    });
  };
}

@ValidatorConstraint({ async: false })
class UnitArgsValidator implements ValidatorConstraintInterface {
  validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
    return isNumber(value);
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a number conforming to the specified constraints`;
  }
}

const prefixes: { prefix: string; convfactor: number }[] = [
  { prefix: 'Y', convfactor: 1e24 },
  { prefix: 'Z', convfactor: 1e21 },
  { prefix: 'E', convfactor: 1e18 },
  { prefix: 'P', convfactor: 1e15 },
  { prefix: 'T', convfactor: 1e12 },
  { prefix: 'G', convfactor: 1e9 },
  { prefix: 'M', convfactor: 1e6 },
  { prefix: 'k', convfactor: 1e3 },
  { prefix: 'h', convfactor: 1e2 },
  { prefix: 'da', convfactor: 1e1 },
  { prefix: 'd', convfactor: 1e-1 },
  { prefix: 'c', convfactor: 1e-2 },
  { prefix: 'm', convfactor: 1e-3 },
  { prefix: 'μ', convfactor: 1e-6 },
  { prefix: 'n', convfactor: 1e-9 },
  { prefix: 'p', convfactor: 1e-12 },
  { prefix: 'f', convfactor: 1e-15 },
  { prefix: 'a', convfactor: 1e-18 },
  { prefix: 'z', convfactor: 1e-21 },
  { prefix: 'y', convfactor: 1e-24 },
];

export function verifyUnit(unit: string, metric: string): number {
  if (unit === '' || metric === '') return -1;
  const definition = units[metric];

  for (const dimension of definition.dimensions) {
    const components = dimension.split('*');
    const nominator = components.filter((v) => !v.includes('-'));
    const denominator = components.filter((v) => v.includes('-'));

    const nomIndices = computeIndices(unit.split('/')[0], nominator);
    const denomIndices = computeIndices(unit.split('/')[1] || '', denominator);

    const nomFactor = verifyIndices(nomIndices, unit.split('/')[0]);
    const denomFactor = verifyIndices(denomIndices, unit.split('/')[1]);

    if (nomFactor > 0 && denomFactor > 0) {
      return nomFactor / denomFactor;
    }
  }
  return -1;
}

function verifyIndices(indices: { index: number; length: number; convfactor: number }[][], unit: string): number {
  if (indices.length === 0 || !unit) return 1;

  const filtered = indices
    .map((arr) => arr.filter((v) => v.index !== -1))
    .reduce(
      (previousValue, currentValue) => {
        if (currentValue.length > 1) {
          // copy existing arrays *length* times
          for (let j = 0; j < currentValue.length - 1; j++) {
            previousValue.forEach((value) => previousValue.push([...value]));
          }
        }
        let index = 0;
        while (index < previousValue.length) {
          previousValue[index].push(currentValue[index % currentValue.length]);
          index++;
        }

        return previousValue;
      },
      [[]],
    );

  outer: for (const filteredElement of filtered) {
    let index = 0;
    let convfactor = 1;
    while (index != unit.length) {
      const find = filteredElement.find((obj) => obj?.index === index);
      if (!find) continue outer;
      index += find.length;
      convfactor *= find.convfactor;
    }
    return convfactor;
  }
  return -1;
}

function computeIndices(unit: string, dimensions: string[]) {
  return dimensions.map((dimension) => {
    const options = computeUnitOptions(dimension);
    const indices = options.map((preUnit) => unit.indexOf(preUnit.prefUnit));
    return indices.map((ind, index) => ({
      index: ind,
      length: options[index].prefUnit.length,
      convfactor: options[index].convfactor,
      offset: options[index].offset,
    }));
  });
}

export function computeUnitOptions(dimension: string): { prefUnit: string; convfactor: number; offset: number }[] {
  const definition = units[dimensionToUnitMap[dimension.substring(0, 1)]];
  const exponent = dimension.length === 1 ? 1 : Number.parseInt(dimension.substring(dimension.length - 1));
  const withPrefixes = definition.units
    .filter((unit) => unit.SIPrefixes)
    .map((unit) =>
      prefixes.map((prefix) => ({
        prefUnit: prefix.prefix.concat(unit.unit),
        convfactor: Math.pow(prefix.convfactor * unit.conversionFactor, exponent),
        offset: unit.offset || 0,
      })),
    )
    .reduce((prev, curr) => prev.concat(curr), []);
  const allUnits = withPrefixes.concat(
    definition.units.map((unit) => ({
      prefUnit: unit.unit,
      convfactor: Math.pow(unit.conversionFactor, exponent),
      offset: unit.offset || 0,
    })),
  );
  return dimension.length > 1 && !dimension.endsWith('-1')
    ? allUnits.map((unit) => ({
        prefUnit: `${unit.prefUnit}^${dimension.substring(dimension.length - 1)}`,
        convfactor: unit.convfactor,
        offset: unit.offset,
      }))
    : allUnits;
}
