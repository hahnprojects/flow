import {
  isDefined,
  registerDecorator,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsNotSiblingOfConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (isDefined(value)) {
      return this.getFailedConstraints(args).length === 0;
    } else {
      return !args.constraints.every((prop) => !isDefined(args.object[prop]));
    }
  }

  defaultMessage(args: ValidationArguments) {
    if (args.value) {
      return `${args.property} cannot exist alongside the following defined properties: ${this.getFailedConstraints(args).join(', ')}`;
    } else {
      return `at least one of the properties must be defined`;
    }
  }

  getFailedConstraints(args: ValidationArguments) {
    return args.constraints.filter((prop) => isDefined(args.object[prop]));
  }
}

// Create Decorator for the constraint that was just created
function IsNotSiblingOf(props: string[], validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: props,
      validator: IsNotSiblingOfConstraint,
    });
  };
}

// Helper function for determining if a prop should be validated
function incompatibleSiblingsNotPresent(incompatibleSiblings: string[]) {
  return (o, v) =>
    Boolean(
      isDefined(v) || incompatibleSiblings.every((prop) => !isDefined(o[prop])), // Validate if all incompatible siblings are not defined
    );
}

export function IncompatableWith(incompatibleSiblings: string[]) {
  const notSibling = IsNotSiblingOf(incompatibleSiblings);
  const validateIf = ValidateIf(incompatibleSiblingsNotPresent(incompatibleSiblings));
  return (target: any, key: string) => {
    notSibling(target, key);
    validateIf(target, key);
  };
}
