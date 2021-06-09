export const dimensionToUnitMap = {
  // SI dimensions
  T: 'time',
  L: 'length',
  M: 'mass',
  I: 'electricCurrent',
  Θ: 'thermodynamicTemperature',
  N: 'amountOfSubstance',
  J: 'luminousIntensity',

  // pseudo dimensions
  U: 'voltage',
  F: 'force',
  E: 'energy',
  W: 'power',
  P: 'pressure',
  A: 'angle',
  V: 'volume',
  f: 'frequency',
};

export const units: UnitDefinitions = {
  time: {
    units: [
      {
        unit: 's',
        conversionFactor: 1,
        SIPrefixes: false,
      },
      {
        unit: 'min',
        conversionFactor: 60,
        SIPrefixes: false,
      },
      {
        unit: 'h',
        conversionFactor: 60 * 60,
        SIPrefixes: false,
      },
      {
        unit: 'd',
        conversionFactor: 60 * 60 * 24,
        SIPrefixes: false,
      },
      {
        unit: 'w',
        conversionFactor: 60 * 60 * 24 * 7,
        SIPrefixes: false,
      },
      {
        unit: 'j',
        conversionFactor: 60 * 60 * 24 * 365,
        SIPrefixes: false,
      },
    ],
    baseUnit: 's',
    dimensions: ['T'],
  },
  length: {
    units: [
      {
        unit: 'm',
        conversionFactor: 1,
        SIPrefixes: true,
      },
      {
        unit: 'in',
        conversionFactor: 1 / 39.3701,
        SIPrefixes: false,
      },
      {
        unit: 'ft',
        conversionFactor: 1 / 3.28084,
        SIPrefixes: false,
      },
      {
        unit: 'yd',
        conversionFactor: 1 / 0.9144,
        SIPrefixes: false,
      },
      {
        unit: 'mi',
        conversionFactor: 1 / 1609.34,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'm',
    dimensions: ['L'],
  },
  mass: {
    units: [
      {
        unit: 'g',
        conversionFactor: 0.001,
        SIPrefixes: true,
      },
      {
        unit: 'lbs',
        conversionFactor: 0.45359237,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'kg',
    dimensions: ['M'],
  },
  electricCurrent: {
    units: [
      {
        unit: 'A',
        conversionFactor: 1,
        SIPrefixes: true,
      },
    ],
    baseUnit: 'A',
    dimensions: ['I'],
  },
  thermodynamicTemperature: {
    units: [
      {
        unit: 'K',
        conversionFactor: 1,
        SIPrefixes: true,
        offset: 0,
      },
      {
        unit: 'C',
        conversionFactor: 1,
        SIPrefixes: false,
        offset: 273.15,
      },
      {
        unit: 'F',
        conversionFactor: 5 / 9,
        SIPrefixes: false,
        offset: 255.372,
      },
    ],
    baseUnit: 'K',
    dimensions: ['Θ'],
  },
  amountOfSubstance: {
    units: [
      {
        unit: 'mol',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'mol',
    dimensions: ['N'],
  },
  luminousIntensity: {
    units: [
      {
        unit: 'cd',
        conversionFactor: 1,
        SIPrefixes: true,
      },
    ],
    baseUnit: 'cd',
    dimensions: ['J'],
  },
  voltage: {
    units: [
      {
        unit: 'V',
        conversionFactor: 1,
        SIPrefixes: true,
      },
    ],
    baseUnit: 'V',
    dimensions: ['U', 'M*L2*I−1*T−3'],
  },
  force: {
    units: [
      {
        unit: 'N',
        conversionFactor: 1,
        SIPrefixes: true,
      },
      {
        unit: 'lbf',
        conversionFactor: 4.4482,
        SIPrefixes: false,
      },
      {
        unit: 'gf',
        conversionFactor: 0.00980665,
        SIPrefixes: false,
      },
      {
        unit: 'kgf',
        conversionFactor: 9.80665,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'N',
    dimensions: ['F', 'L*M*T-2'],
  },
  energy: {
    units: [
      {
        unit: 'J',
        conversionFactor: 1,
        SIPrefixes: true,
      },
      {
        unit: 'Btu',
        conversionFactor: 1055,
        SIPrefixes: true,
      },
    ],
    baseUnit: 'J',
    dimensions: ['E', 'M*L2*T-2'],
  },
  power: {
    units: [
      {
        unit: 'W',
        conversionFactor: 1,
        SIPrefixes: true,
      },
      {
        unit: 'PS',
        conversionFactor: 735.49875,
        SIPrefixes: false,
      },
      {
        unit: 'hp',
        conversionFactor: 745.7,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'W',
    dimensions: ['W', 'E*T-1', 'M*L2*T-3'],
  },
  pressure: {
    units: [
      {
        unit: 'Pa',
        conversionFactor: 1,
        SIPrefixes: true,
      },
      {
        unit: 'bar',
        conversionFactor: 100000,
        SIPrefixes: true,
      },
      {
        unit: 'at',
        conversionFactor: 98066.5,
        SIPrefixes: false,
      },
      {
        unit: 'atm',
        conversionFactor: 101325,
        SIPrefixes: false,
      },
      {
        unit: 'Torr',
        conversionFactor: 133.322368421,
        SIPrefixes: true,
      },
    ],
    baseUnit: 'Pa',
    dimensions: ['P', 'F*L-2', 'E*L-3', 'M*L-1*T-2'],
  },
  frequency: {
    units: [
      {
        unit: 'Hz',
        conversionFactor: 1,
        SIPrefixes: true,
      },
    ],
    baseUnit: 'Hz',
    dimensions: ['f', 'T-1'],
  },

  area: {
    units: [
      {
        unit: 'm^2',
        conversionFactor: 1,
        SIPrefixes: false,
      },
      {
        unit: 'are',
        conversionFactor: 100,
        SIPrefixes: false,
      },
      {
        unit: 'hectare',
        conversionFactor: 10000,
        SIPrefixes: false,
      },
      {
        unit: 'acre',
        conversionFactor: 4046.86,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'm^2',
    dimensions: ['L2'],
  },
  volume: {
    units: [
      {
        unit: 'm^3',
        conversionFactor: 1,
        SIPrefixes: false,
      },
      {
        unit: 'barrel',
        conversionFactor: 0.158987294928,
        SIPrefixes: false,
      },
      {
        unit: 'litre',
        conversionFactor: 0.001,
        SIPrefixes: false,
      },
      {
        unit: 'gallon',
        conversionFactor: 0.003785411784,
        SIPrefixes: false,
      },
      {
        unit: 'pint',
        conversionFactor: 0.000473176473,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'm^3',
    dimensions: ['L3', 'V'],
  },
  angle: {
    units: [
      {
        unit: 'rad',
        conversionFactor: 1,
        SIPrefixes: true,
      },
      {
        unit: 'deg',
        conversionFactor: 57.2958,
        SIPrefixes: true,
      },
      {
        unit: 'turn',
        conversionFactor: 1 / (2 * Math.PI),
        SIPrefixes: true,
      },
      {
        unit: 'gon',
        conversionFactor: 63.662,
        SIPrefixes: true,
      },
    ],
    baseUnit: 'rad',
    dimensions: ['A', 'L*L-1'],
  },
  translationalAcceleration: {
    units: [
      {
        unit: 'm/s^2',
        conversionFactor: 1,
        SIPrefixes: false,
      },
      {
        unit: 'Gal',
        conversionFactor: 0.01,
        SIPrefixes: false,
      },
      {
        unit: 'g0',
        conversionFactor: 9.80665,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'm/s^2',
    dimensions: ['L*T-2'],
  },
  translationalVelocity: {
    units: [
      {
        unit: 'm/s',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'm/s',
    dimensions: ['L*T-1'],
  },
  get translationalDisplacement() {
    return this.length;
  },
  springConstant: {
    units: [
      {
        unit: 'N/m',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'N/m',
    dimensions: ['F*L-1', 'M*T-2'],
  },
  rotationalAcceleration: {
    units: [
      {
        unit: 'rad/s^2',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'rad/s^2',
    dimensions: ['A*T-2', 'L*L-1*T-2', 'T-2'],
  },
  rotationalVelocity: {
    units: [
      {
        unit: 'rad/s',
        conversionFactor: 1,
        SIPrefixes: true,
      },
    ],
    baseUnit: 'rad/s',
    dimensions: ['A*T-1', 'L*L-1*T-1', 'T-1'],
  },
  get rotationalDisplacement() {
    return this.angle;
  },
  torque: {
    units: [
      {
        unit: 'Nm',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'Nm',
    dimensions: ['F*L', 'M*L2*T−2'],
  },
  momentOfInertia: {
    units: [
      {
        unit: 'kgm^2',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'kgm^2',
    dimensions: ['M*L2', 'F*L*T2'],
  },
  rotatingUnbalance: {
    units: [
      {
        unit: 'kgm',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'kgm',
    dimensions: ['L*M'],
  },
  get mechanicalPower() {
    return this.power;
  },
  get mechanicalEnergy() {
    return this.energy;
  },
  dynamicViscosity: {
    units: [
      {
        unit: 'Pas',
        conversionFactor: 1,
        SIPrefixes: false,
      },
      {
        unit: 'poise',
        conversionFactor: 0.1,
        SIPrefixes: true,
      },
    ],
    baseUnit: 'Pas',
    dimensions: ['P*T', 'F*T*L-2', 'M*L-1*T-1'],
  },
  kinematicViscosity: {
    units: [
      {
        unit: 'm^2/s',
        conversionFactor: 1,
        SIPrefixes: false,
      },
      {
        unit: 'St',
        conversionFactor: 0.0001,
        SIPrefixes: true,
      },
    ],
    baseUnit: 'm^2/s',
    dimensions: ['L2*T-1'],
  },
  volumeFlow: {
    units: [
      {
        unit: 'm^3/s',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'm^3/s',
    dimensions: ['V*T-1', 'L3*T-1'],
  },
  massFlow: {
    units: [
      {
        unit: 'kg/s',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'kg/s',
    dimensions: ['M*L-1'],
  },
  heatFlux: {
    units: [
      {
        unit: 'W/m^2',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'W/m^2',
    dimensions: ['W*L-2', 'E*T-1*L-2', 'M*T-3'],
  },
  get thermalEnergy() {
    return this.energy;
  },
  specificHeatCapacity: {
    units: [
      {
        unit: 'J/kgK',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'J/kgK',
    dimensions: ['E*M-1*Θ−1', 'L2*Θ−1*T−2'],
  },
  thermalTransmittance: {
    units: [
      {
        unit: 'W/m^2K',
        conversionFactor: 1,
        SIPrefixes: false,
      },
    ],
    baseUnit: 'W/m^2K',
    dimensions: ['W*L-2*Θ-1', 'E*T-1*L-2*Θ-1'],
  },
  get electricalPower() {
    return this.power;
  },
  get electricalEnergy() {
    return this.energy;
  },
  get electricalFrequency() {
    return this.frequency;
  },
};

export type UnitDefinitions = {
  [key: string]: UnitDefinition;
};

export type UnitDefinition = {
  units: {
    unit: string;
    conversionFactor: number;
    SIPrefixes: boolean;
    offset?: number;
  }[];
  baseUnit: string;
  dimensions: string[];
};
