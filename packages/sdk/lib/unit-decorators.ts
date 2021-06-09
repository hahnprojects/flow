import { ValidationOptions } from 'class-validator';
import { makeUnitDecorator } from './unit-utils';
import { units } from './units';

export function IsTime(unit = units.time.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'time', validationOptions);
}

export function IsLength(unit = units.length.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'length', validationOptions);
}

export function IsMass(unit = units.mass.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'mass', validationOptions);
}

export function IsElectricCurrent(unit = units.electricCurrent.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'electricCurrent', validationOptions);
}

export function IsThermodynamicTemperature(unit = units.thermodynamicTemperature.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'thermodynamicTemperature', validationOptions);
}

export function IsAmountOfSubstance(unit = units.amountOfSubstance.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'amountOfSubstance', validationOptions);
}

export function IsLuminousIntensity(unit = units.luminousIntensity.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'luminousIntensity', validationOptions);
}

export function IsVoltage(unit = units.voltage.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'voltage', validationOptions);
}

export function IsForce(unit = units.force.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'force', validationOptions);
}

export function IsEnergy(unit = units.energy.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'energy', validationOptions);
}

export function IsPower(unit = units.power.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'power', validationOptions);
}

export function IsPressure(unit = units.pressure.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'pressure', validationOptions);
}

export function IsFrequency(unit = units.frequency.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'frequency', validationOptions);
}

export function IsArea(unit = units.area.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'area', validationOptions);
}

export function IsVolume(unit = units.volume.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'volume', validationOptions);
}

export function IsAngle(unit = units.angle.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'angle', validationOptions);
}

export function IsTranslationalAcceleration(unit = units.translationalAcceleration.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'translationalAcceleration', validationOptions);
}

export function IsTranslationalVelocity(unit = units.translationalVelocity.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'translationalVelocity', validationOptions);
}

export function IsTranslationalDisplacement(unit = units.translationalDisplacement.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'translationalDisplacement', validationOptions);
}

export function IsSpringConstant(unit = units.springConstant.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'springConstant', validationOptions);
}

export function IsRotationalAcceleration(unit = units.rotationalAcceleration.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'rotationalAcceleration', validationOptions);
}

export function IsRotationalVelocity(unit = units.rotationalVelocity.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'rotationalVelocity', validationOptions);
}

export function IsRotationalDisplacement(unit = units.rotationalDisplacement.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'rotationalDisplacement', validationOptions);
}

export function IsTorque(unit = units.torque.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'torque', validationOptions);
}

export function IsMomentOfInertia(unit = units.momentOfInertia.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'momentOfInertia', validationOptions);
}

export function IsRotatingUnbalance(unit = units.rotatingUnbalance.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'rotatingUnbalance', validationOptions);
}

export function IsMechanicalPower(unit = units.mechanicalPower.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'mechanicalPower', validationOptions);
}

export function IsMechanicalEnergy(unit = units.mechanicalEnergy.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'mechanicalEnergy', validationOptions);
}

export function IsDynamicViscosity(unit = units.dynamicViscosity.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'dynamicViscosity', validationOptions);
}

export function IsVolumeFlow(unit = units.volumeFlow.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'volumeFlow', validationOptions);
}

export function IsMassFlow(unit = units.massFlow.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'massFlow', validationOptions);
}

export function IsHeatFlux(unit = units.heatFlux.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'heatFlux', validationOptions);
}

export function IsThermalEnergy(unit = units.thermalEnergy.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'thermalEnergy', validationOptions);
}

export function IsSpecificHeatCapacity(unit = units.specificHeatCapacity.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'specificHeatCapacity', validationOptions);
}

export function IsThermalTransmittance(unit = units.thermalTransmittance.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'thermalTransmittance', validationOptions);
}

export function IsElectricalPower(unit = units.electricalPower.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'electricalPower', validationOptions);
}

export function IsElectricalEnergy(unit = units.electricalEnergy.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'electricalEnergy', validationOptions);
}

export function IsElectricalFrequency(unit = units.electricalFrequency.baseUnit, validationOptions?: ValidationOptions) {
  return makeUnitDecorator(unit, 'electricalFrequency', validationOptions);
}
