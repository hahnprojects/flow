import { FlowElement } from './FlowElement';

export function FlowModule(metadata: { name: string; declarations: Array<ClassType<FlowElement>> }): ClassDecorator {
  const validateNameRegExp = new RegExp(/^(@[a-z][a-z0-9-]*\/)?[a-z][a-z0-9-]*$/);
  if (!validateNameRegExp.test(metadata.name)) {
    throw new Error(
      `Flow Module name (${metadata.name}) is not valid. Name must be all lowercase and not contain any special characters except for hyphens. Can optionally start with a scope "@scopename/"`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return <TFunction extends Function>(target: TFunction): TFunction | void => {
    Reflect.defineMetadata('module:name', metadata.name, target);
    Reflect.defineMetadata('module:declarations', metadata.declarations, target);
  };
}

type ClassType<T> = new (...args: any[]) => T;
