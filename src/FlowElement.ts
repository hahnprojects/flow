import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

import { API } from './api';
import { FlowApplication, FlowContext } from './FlowApplication';
import { FlowEvent } from './FlowEvent';
import { FlowLogger } from './FlowLogger';
import { handleApiError } from './utils';

export abstract class FlowElement {
  public readonly functionFqn: string;
  protected readonly logger: FlowLogger;
  protected readonly metadata: ElementMetadata;
  protected readonly api?: API;
  private readonly app: FlowApplication;

  constructor({ app, api, logger, publishEvent, ...metadata }: Context) {
    this.app = app;
    this.api = api;
    this.metadata = { ...metadata, functionFqn: this.functionFqn };
    this.logger = new FlowLogger(this.metadata, logger, publishEvent);
  }

  public handleApiError = (error: any) => handleApiError(error, this.logger);

  public handleMessage?: (message: any) => void;

  protected emitOutput(data: object = {}, outputId = 'default', time = new Date()): FlowEvent {
    const event = new FlowEvent(this.metadata, data, outputId, time);
    if (this.app) {
      this.app.emit(event);
    }
    return event;
  }

  protected validateProperties<P>(classType: ClassType<P>, properties: any = {}, whitelist = false): P {
    const props: P = plainToClass<P, any>(classType, properties);
    const errors = validateSync(props, { whitelist });
    if (errors && Array.isArray(errors) && errors.length > 0) {
      for (const e of errors) {
        this.logger.error(`Validation for property "${e.property}" failed:\n${JSON.stringify(e.constraints || {})}\nvalue: ${e.value}`);
      }
      throw new Error('Properties Validation failed');
    } else {
      return props;
    }
  }

  protected validateEventData<P>(classType: ClassType<P>, event: FlowEvent, whitelist = false): P {
    return this.validateProperties(classType, event.getData(), whitelist);
  }
}

export interface ElementMetadata {
  id: string;
  name?: string;
  deploymentId?: string;
  flowId?: string;
  functionFqn?: string;
}

export function InputStream(id: string = 'default', options?: { concurrent?: number }): MethodDecorator {
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(`stream:${id}`, propertyKey, target.constructor);
    if (options) {
      Reflect.defineMetadata(`stream:options:${id}`, options, target.constructor);
    }
  };
}

export function FlowFunction(fqn: string): ClassDecorator {
  const fqnRegExp = new RegExp('^([a-zA-Z][a-zA-Z0-9]*[.-])*[a-zA-Z][a-zA-Z0-9]*$');
  if (!fqnRegExp.test(fqn)) {
    throw new Error(`Flow Function FQN (${fqn}) is not valid`);
  }

  return <TFunction extends Function>(target: TFunction): TFunction | void => {
    Reflect.defineMetadata('element:functionFqn', fqn, target);
    target.prototype.functionFqn = fqn;
  };
}

export type Context = FlowContext & ElementMetadata;

type ClassType<T> = new (...args: any[]) => T;
