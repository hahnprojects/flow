import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Options, PythonShell } from 'python-shell';
import { API } from '@hahnpro/hpc-api';

import { ClassType, DeploymentMessage, FlowContext, FlowElementContext } from './flow.interface';
import { Context, FlowApplication } from './FlowApplication';
import { FlowEvent } from './FlowEvent';
import { FlowLogger } from './FlowLogger';
import { fillTemplate, handleApiError } from './utils';

export abstract class FlowElement<T = any> {
  public readonly functionFqn: string;
  protected readonly api?: API;
  protected readonly logger: FlowLogger;
  protected metadata: FlowElementContext;
  protected properties: T;
  private readonly app?: FlowApplication;
  private readonly rpcRoutingKey: string;

  private stopPropagateStream: Map<string, boolean> = new Map<string, boolean>();

  constructor(
    { app, logger, ...metadata }: Context,
    properties?: unknown,
    private readonly propertiesClassType?: ClassType<T>,
    private readonly whitelist = false,
  ) {
    this.app = app;
    this.api = this.app?.api;
    this.metadata = { ...metadata, functionFqn: this.functionFqn };
    this.logger = new FlowLogger(this.metadata, logger || undefined, this.app?.publishEvent);
    this.rpcRoutingKey = (this.metadata.flowId || '') + (this.metadata.deploymentId || '') + this.metadata.id;
    if (properties) {
      this.setProperties(properties as T);
    }
  }

  get flowProperties() {
    return this.app?.getProperties?.() || {};
  }

  public onDestroy?: () => void;

  public onMessage?: (message: DeploymentMessage) => void;

  public onFlowPropertiesChanged?: (properties: Record<string, any>) => void;

  public onContextChanged = (context: Partial<FlowContext>): void => {
    this.metadata = { ...this.metadata, ...context };
  };

  public onPropertiesChanged = (properties: T): void => {
    this.setProperties(properties);
  };

  public getMetadata = () => this.metadata;

  protected setProperties = (properties: T): void => {
    if (this.propertiesClassType) {
      this.properties = this.validateProperties(this.propertiesClassType, properties, this.whitelist);
    } else {
      this.properties = properties;
    }
  };

  public handleApiError = (error: any) => handleApiError(error, this.logger);

  /**
   * @deprecated since version 4.8.0, will be removed in 5.0.0, use emitEvent(...) instead
   */
  protected emitOutput(data: any = {}, outputId = 'default', time = new Date()): FlowEvent {
    return this.emitEvent(data, null, outputId, time);
  }

  protected emitEvent(data: any, inputEvent: FlowEvent, outputId = 'default', time = new Date()): FlowEvent {
    const partialEvent = new FlowEvent(this.metadata, data, outputId, time);
    const completeEvent = new FlowEvent(this.metadata, { ...(inputEvent?.getData() || {}), ...data }, outputId, time);

    const streamID = inputEvent?.getMetadata()?.inputStreamId || '';
    if ((this.stopPropagateStream.has(streamID) && this.stopPropagateStream.get(streamID)) || !this.stopPropagateStream.has(streamID)) {
      this.app?.emit(partialEvent);
      return partialEvent;
    } else {
      this.app?.emitPartial(completeEvent, partialEvent);
      return completeEvent;
    }
  }

  protected validateProperties<P>(classType: ClassType<P>, properties: any = {}, whitelist = false): P {
    const props: P = plainToInstance<P, any>(classType, properties);
    const errors = validateSync(props as any, { whitelist });
    if (Array.isArray(errors) && errors.length > 0) {
      for (const e of errors) {
        this.logValidationErrors(e);
      }
      throw new Error('Properties Validation failed');
    } else {
      return props;
    }
  }

  protected logValidationErrors(error: any, parent?: string) {
    const { children, constraints, property, value } = error;
    const name = parent ? parent + '.' + property : property;
    if (constraints) {
      this.logger.error(`Validation for property "${name}" failed:\n${JSON.stringify(constraints || {})}\nvalue: ${value}`);
    } else if (Array.isArray(children)) {
      for (const child of children) {
        this.logValidationErrors(child, name);
      }
    }
  }

  protected validateEventData<E>(classType: ClassType<E>, event: FlowEvent, whitelist = false): E {
    return this.validateProperties(classType, event.getData(), whitelist);
  }

  protected interpolate = (value: any, ...templateVariables: any) => fillTemplate(value, ...templateVariables);

  protected async callRpcFunction(functionName: string, ...args: any[]) {
    try {
      return (await this.app?.rpcClient())?.callFunction(this.rpcRoutingKey, functionName, ...args);
    } catch (err) {
      this.logger.error(err);
    }
  }

  protected runPyRpcScript(scriptPath: string, ...args: (string | boolean | number)[]) {
    const options: Options = {
      mode: 'text',
      pythonOptions: ['-u'],
      args: [__dirname, this.rpcRoutingKey, ...args.map((v) => v.toString())],
    };
    return PythonShell.run(scriptPath, options, (err, outputs) => {
      if (err) {
        this.logger.error(err);
      }
      this.logger.debug(outputs);
    });
  }
}

export function InputStream(id = 'default', options?: { concurrent?: number; stopPropagation?: boolean }): MethodDecorator {
  return (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(`stream:${id}`, propertyKey, target.constructor);
    if (options) {
      Reflect.defineMetadata(`stream:options:${id}`, options, target.constructor);
    }

    const method = propertyDescriptor.value;

    propertyDescriptor.value = function (event: FlowEvent) {
      if (!this.stopPropagateStream.has(id)) {
        this.stopPropagateStream.set(id, options?.stopPropagation ?? false);
      }

      // add input stream to data to later determine if data should be propagated
      return method.call(
        this,
        new FlowEvent(
          { id: event.getMetadata().elementId, ...event.getMetadata(), inputStreamId: id },
          event.getData(),
          event.getType(),
          new Date(event.getTime()),
        ),
      );
    };
  };
}

export function FlowFunction(fqn: string): ClassDecorator {
  const fqnRegExp = new RegExp('^([a-zA-Z][a-zA-Z0-9]*[.-])*[a-zA-Z][a-zA-Z0-9]*$');
  if (!fqnRegExp.test(fqn)) {
    throw new Error(`Flow Function FQN (${fqn}) is not valid`);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  return <TFunction extends Function>(target: TFunction): TFunction | void => {
    Reflect.defineMetadata('element:functionFqn', fqn, target);
    target.prototype.functionFqn = fqn;
  };
}

export abstract class FlowResource<T = any> extends FlowElement<T> {}
export abstract class FlowTask<T = any> extends FlowElement<T> {}
export abstract class FlowTrigger<T = any> extends FlowElement<T> {}
export abstract class FlowDashboard<T = any> extends FlowResource<T> {}
