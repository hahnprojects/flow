import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';

import { API } from './api';
import { FlowApplication, FlowContext } from './FlowApplication';
import { FlowEvent } from './FlowEvent';
import { FlowLogger } from './FlowLogger';

export abstract class FlowElement {
  protected readonly metadata: ElementMetadata;
  protected readonly api?: API;
  protected readonly logger: FlowLogger;
  private readonly app: FlowApplication;
  private readonly logEvents: boolean;

  constructor({ app, api, logger, logEvents, ...metadata }: Context) {
    this.app = app;
    this.api = api;
    this.logEvents = logEvents || false;
    this.logger = new FlowLogger(metadata, logger);
    this.metadata = metadata;
    if (!this.app) {
      // this.logger.warn('Flow Application is not defined');
    }
  }

  protected emitOutput(data: object = {}, outputId = 'default', time = new Date()): FlowEvent {
    return this.emitEvent(new FlowEvent(this.metadata, data, outputId, time));
  }

  protected emitEvent(event: FlowEvent): FlowEvent {
    const id = `${event.getSubject()}.${event.getType()}`;
    if (this.app) {
      this.app.emit(id, event);
      if (this.logEvents && event.getDataContentType() === 'application/json') {
        const size = Buffer.byteLength(event.toString());
        if (size <= 64 * 1024 /* 64 kb */) {
          this.logger.verbose(event.getData());
        } else {
          this.logger.verbose(`Not logging emitted event because of its size: ${size} bytes`);
        }
      }
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
  diagramId?: string;
  flowId?: string;
}

export function InputStream(id: string = 'default', options?: { concurrent?: number }): MethodDecorator {
  return (target: Object, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(`stream:${id}`, propertyKey, target.constructor);
    if (options) {
      Reflect.defineMetadata(`stream:options:${id}`, options, target.constructor);
    }
  };
}

export function FlowFunction(fqn: string, options?: { concurrent?: number }): ClassDecorator {
  const fqnRegExp = new RegExp('^([a-zA-Z][a-zA-Z0-9]*[.-])*[a-zA-Z][a-zA-Z0-9]*$');
  if (!fqnRegExp.test(fqn)) {
    throw new Error(`Flow Function FQN (${fqn}) is not valid`);
  }

  return <TFunction extends Function>(target: TFunction): TFunction | void => {
    Reflect.defineMetadata('element:functionFqn', fqn, target);
    if (options) {
      Reflect.defineMetadata('element:options', options, target);
    }
  };
}

export type Context = FlowContext & ElementMetadata;

type ClassType<T> = new (...args: any[]) => T;
