# Unit-System

On top of the Type-System the HahnPRP Flow-SDK provides a way to add extra information to numerical
attributes of the Properties of a Flow-Function. This system enables extra typing in form of
units and values.

To add this information it is only necessary to add a decorator to the attribute.

## Available Units

| Measure                    | Decorator                   | Units                              |
| -------------------------- | --------------------------- | ---------------------------------- |
| Time                       | IsTime                      | s, min, h, d, w, j                 |
| Length                     | IsLength                    | m\*, in, ft, yd, mi                |
| Mass                       | IsMass                      | g\*, lbs                           |
| Electric Current           | IsElectricCurrent           | A\*                                |
| Thermodynamic Temperature  | IsThermodynamicTemperature  | K\*, C, F                          |
| Amount Of Substance        | IsAmountOfSubstance         | mol                                |
| Luminous Intensity         | IsLuminousIntensity         | cd\*                               |
| Voltage                    | IsVoltage                   | V\*                                |
| Force                      | IsForce                     | N\*, lbf, gf, kgf                  |
| Energy                     | IsEnergy                    | J\*, Btu                           |
| Power                      | IsPower                     | W\*, PS, hp                        |
| Pressure                   | IsPressure                  | Pa*, bar*, at, atm, Torr\*         |
| Frequency                  | IsFrequency                 | Hz\*                               |
| Area                       | IsArea                      | m^2\*, are, hectare, acre          |
| Volume                     | IsVolume                    | m^3\*, barrel, litre, gallon, pint |
| Angle                      | IsAngle                     | rad*, deg*, turn*, gon*            |
| Translational Acceleration | IsTranslationalAcceleration | m/s^2\*, Gal, g0                   |
| Translational Velocity     | IsTranslationalVelocity     | m/s\*                              |
| Translational Displacement | IsTranslationalDisplacement | m\*, in, ft, yd, mi                |
| Spring Constant            | IsSpringConstant            | N/m\*                              |
| Rotational Acceleration    | IsRotationalAcceleration    | rad/s^2\*                          |
| Rotational Velocity        | IsRotationalVelocity        | rad/s\*                            |
| Rotational Displacement    | IsRotationalDisplacement    | rad*, deg*, turn*, gon*            |
| Torque                     | IsTorque                    | Nm\*                               |
| Moment Of Inertia          | IsMomentOfInertia           | kgm^2\*                            |
| Rotating Unbalance         | IsRotatingUnbalance         | kgm\*                              |
| Mechanical Power           | IsMechanicalPower           | W\*, PS, hp                        |
| Mechanical Energy          | IsMechanicalEnergy          | J\*, Btu                           |
| Dynamic Viscosity          | IsDynamicViscosity          | Pas\*, poise                       |
| Kinematic Viscosity        | IsKinematicViscosity        | m^2/s\*, St                        |
| Volume Flow                | IsVolumeFlow                | m^3/s\*                            |
| Mass Flow                  | IsMassFlow                  | kg/s\*                             |
| Heat Flux                  | IsHeatFlux                  | W/m^2\*                            |
| Thermal Energy             | IsThermalEnergy             | J\*, Btu                           |
| Specific Heat Capacity     | IsSpecificHeatCapacity      | J/kgK\*                            |
| Thermal Transmittance      | IsThermalTransmittance      | W/m^2K\*                           |
| Electrical Power           | IsElectricalPower           | W\*, PS, hp                        |
| Electrical Energy          | IsElectricalEnergy          | J\*, Btu                           |
| Electrical Frequency       | IsElectricalFrequency       | Hz\*                               |

Units with (\*) can be used with SI-Prefixes (k, M, m ...) or with an equivalent replacement Unit. Such as
J -> Btu, J/kgK -> Btu/lbs°F, m/s -> mi/h.

The Units are inserted as the Parameter of the Decorator.

Units are being validated based on their physical-dimensions. This enables the use of Units other than the
ones described above. For example:

- Power in J/s
- Thermal Transmittance in Btu/hft^2F
- Pressure in kgf/m^2 or J/m^3
- ...

The available dimensions are the SI-dimensions and some pseudo-dimensions that are useful in validating complex units.

| measure                   | dimension symbol |
| ------------------------- | ---------------- |
| time                      | T                |
| length                    | L                |
| mass                      | M                |
| electric current          | I                |
| thermodynamic temperature | Θ                |
| amount of substance       | N                |
| luminous intensity        | J                |
| voltage                   | U                |
| force                     | F                |
| energy                    | E                |
| power                     | W                |
| pressure                  | P                |
| angle                     | A                |
| volume                    | V                |
| frequency                 | f                |

## Usage

By using any of the decorators above, the use of the `IsNumber` decorator is not necessary.

```typescript
class Properties {
  @IsVoltage('kV')
  voltage: number;
}
```

The above snippet defines a number to be a voltage in kV.

```typescript
class Properties {
  @IsRotationalAcceleration('deg/h^2')
  arg: number;
}
```

This snipped shows the use with a more complex unit.

```typescript
class Properties {
  @IsLength('notAUnit')
  arg: number;
}
```

The use of an invalid unit will cause an error like the following

```markdown
notAUnit is not a valid length.
```

## Request a unit to be added

To make a request for a unit to be added, open an issue and fill out the
unit-request issue template.
