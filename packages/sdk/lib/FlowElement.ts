import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Options, PythonShell } from 'python-shell';
import interp from 'string-interp';

import { API } from './api';
import { ClassType, FlowElementContext, DeploymentMessage, FlowContext } from './flow.interface';
import { Context, FlowApplication } from './FlowApplication';
import { FlowEvent } from './FlowEvent';
import { FlowLogger } from './FlowLogger';
import { handleApiError } from './utils';

export abstract class FlowElement<T = any> {
  public readonly functionFqn: string;
  protected readonly api?: API;
  protected readonly logger: FlowLogger;
  protected metadata: FlowElementContext;
  protected properties: T;
  private readonly app?: FlowApplication;
  private readonly rpcRoutingKey: string;

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
      if (this.propertiesClassType) {
        this.properties = this.validateProperties(this.propertiesClassType, properties, this.whitelist);
      } else {
        this.properties = properties as T;
      }
    }
  }

  get flowProperties() {
    return this.app?.getProperties() || {};
  }

  public onDestroy?: () => void;

  public onMessage?: (message: DeploymentMessage) => void;

  public onFlowPropertiesChanged?: (properties: Record<string, any>) => void;

  public onContextChanged = (context: Partial<FlowContext>): void => {
    this.metadata = { ...this.metadata, ...context };
  };

  public onPropertiesChanged = (properties: T): void => {
    if (this.propertiesClassType) {
      this.properties = this.validateProperties(this.propertiesClassType, properties, this.whitelist);
    } else {
      this.properties = properties;
    }
  };

  public handleApiError = (error: any) => handleApiError(error, this.logger);

  protected emitOutput(data: any = {}, outputId = 'default', time = new Date()): FlowEvent {
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

  protected validateEventData<E>(classType: ClassType<E>, event: FlowEvent, whitelist = false): E {
    return this.validateProperties(classType, event.getData(), whitelist);
  }

  protected interpolate(text: string, ...templateVariables: any): string {
    if (!text?.includes?.('${')) {
      return text;
    }
    for (const variables of templateVariables) {
      const result = interp(text, variables || {});
      if (result) {
        return result;
      }
    }
    return text;
  }

  protected async callRpcFunction(functionName: string, ...args: any[]) {
    try {
      return this.app?.rpcClient?.callFunction(this.rpcRoutingKey, functionName, ...args);
    } catch (err) {
      this.logger.error(err);
    }
  }

  protected runPyRpcScript(scriptPath: string) {
    const options: Options = {
      mode: 'text',
      pythonOptions: ['-u'],
      args: [__dirname, this.rpcRoutingKey],
    };
    return PythonShell.run(scriptPath, options, (err, outputs) => {
      if (err) {
        this.logger.error(err);
      }
      this.logger.debug(outputs);
    });
  }
}

export function InputStream(id = 'default', options?: { concurrent?: number }): MethodDecorator {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
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
