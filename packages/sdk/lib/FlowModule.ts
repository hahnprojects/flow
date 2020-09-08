import { FlowElement } from './FlowElement';

export function FlowModule(metadata: { name: string; declarations: Array<ClassType<FlowElement>> }): ClassDecorator {
  const fqnRegExp = new RegExp('^([a-zA-Z][a-zA-Z0-9]*[.-])*[a-zA-Z][a-zA-Z0-9]*$');
  if (!fqnRegExp.test(metadata.name)) {
    throw new Error(`Flow Module name (${metadata.name}) is not valid`);
  }

  return <TFunction extends Function>(target: TFunction): TFunction | void => {
    Reflect.defineMetadata('module:name', metadata.name, target);
    Reflect.defineMetadata('module:declarations', metadata.declarations, target);
  };
}

type ClassType<T> = new (...args: any[]) => T;
