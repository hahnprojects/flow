import 'reflect-metadata';

import { AmqpConnection, Nack } from '@golevelup/nestjs-rabbitmq';
import { CloudEvent } from 'cloudevents';
import sizeof from 'object-sizeof';
import { PartialObserver, Subject } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { inspect } from 'util';
import { v4 as uuid } from 'uuid';

import { API } from './api';
import { ClassType, Flow, FlowContext, FlowElementContext, DeploymentMessage, StreamOptions } from './flow.interface';
import { FlowElement } from './FlowElement';
import { FlowEvent } from './FlowEvent';
import { Logger, defaultLogger } from './FlowLogger';
import { RpcClient } from './RpcClient';

const MAX_EVENT_SIZE_BYTES = 512 * 1024; // 512kb

/* tslint:disable:no-console */
export class FlowApplication {
  public api: API;
  private context: FlowContext;
  private declarations: { [id: string]: ClassType<FlowElement> } = {};
  private elements: { [id: string]: FlowElement } = {};
  private logger: Logger;
  private properties: Record<string, any>;
  private _rpcClient: RpcClient;

  private outputStreamMap: {
    [streamId: string]: Subject<FlowEvent>;
  } = {};

  constructor(modules: Array<ClassType<any>>, flow: Flow, logger?: Logger, private amqpConnection?: AmqpConnection, skipApi = false) {
    process.on('SIGTERM', () => {
      this.logger.log('Flow Application is terminating.');
      this.destroy().finally(() => process.exit(0));
    });

    this.context = { ...flow.context };
    this.properties = flow.properties || {};
    this.logger = logger || defaultLogger;

    try {
      if (!skipApi) {
        this.api = new API();
      }
    } catch (err) {
      this.logger.error(err?.message || err);
    }

    for (const module of modules) {
      const moduleName = Reflect.getMetadata('module:name', module);
      const moduleDeclarations = Reflect.getMetadata('module:declarations', module);
      if (!moduleName || !moduleDeclarations || !Array.isArray(moduleDeclarations)) {
        throw new Error(`FlowModule (${module.name}) metadata is missing or invalid.`);
      }
      for (const declaration of moduleDeclarations) {
        const functionFqn = Reflect.getMetadata('element:functionFqn', declaration);
        if (!functionFqn) {
          throw new Error(`FlowFunction (${declaration.name}) metadata is missing or invalid.`);
        }
        this.declarations[`${moduleName}.${functionFqn}`] = declaration;
      }
    }

    for (const element of flow.elements) {
      const { id, name, properties, module, functionFqn } = element;
      try {
        const context: Context = { ...this.context, id, name, logger, app: this };
        this.elements[id] = new this.declarations[`${module}.${functionFqn}`](context, properties);
      } catch (err) {
        console.error(err);
        throw new Error(`Could not create FlowElement for ${module}.${functionFqn}`);
      }
    }

    for (const connection of flow.connections) {
      const { source, target, sourceStream = 'default', targetStream = 'default' } = connection;
      if (!source || !target) {
        continue;
      }

      const streamId = `${source}.${sourceStream}`;
      const element = this.elements[target];

      if (!element || !element.constructor) {
        throw new Error(target + ' has not been initialized');
      }
      const streamHandler = Reflect.getMetadata(`stream:${targetStream}`, element.constructor);
      if (!streamHandler || !element[streamHandler]) {
        throw new Error(`${target} does not implement a handler for ${targetStream}`);
      }

      const streamOptions: StreamOptions = Reflect.getMetadata(`stream:options:${targetStream}`, element.constructor) || {};
      const concurrent = streamOptions.concurrent || 1;

      const outputStream = this.getOutputStream(streamId);
      outputStream
        .pipe(
          mergeMap((event: FlowEvent) => element[streamHandler](event), concurrent),
          catchError((err, observable) => {
            element.handleApiError(err);
            return observable;
          }),
        )
        .subscribe();
    }

    if (this.amqpConnection) {
      this.amqpConnection.createSubscriber((msg: any) => this.onMessage(msg), {
        exchange: 'deployment',
        routingKey: this.context.deploymentId,
        queueOptions: { durable: false, exclusive: true },
      });
    }
  }

  public subscribe = (streamId: string, observer: PartialObserver<FlowEvent>) => this.getOutputStream(streamId).subscribe(observer);

  public emit = (event: FlowEvent) => {
    if (event) {
      try {
        this.publishEvent(event);
        this.getOutputStream(event.getStreamId()).next(event);
      } catch (err) {
        this.logger?.error(err);
      }
    }
  };

  public emitPartial = (completeEvent: FlowEvent, partialEvent: FlowEvent) => {
    // send complete event, log only partial event
    try {
      if (completeEvent) {
        this.getOutputStream(completeEvent.getStreamId()).next(completeEvent);
      }
      if (partialEvent) {
        this.publishEvent(partialEvent);
      }
    } catch (err) {
      this.logger?.error(err);
    }
  };

  public getProperties() {
    return this.properties;
  }

  public onMessage = async (event: CloudEvent): Promise<Nack | undefined> => {
    if (event.type === 'com.flowstudio.deployment.update') {
      try {
        const flow = event.data as Flow;
        if (!flow) {
          return new Nack(false);
        }
        let context: Partial<FlowElementContext> = {};
        if (flow.context) {
          this.context = { ...this.context, ...flow.context };
          context = this.context;
        }
        if (flow.properties) {
          this.properties = flow.properties;
          for (const element of Object.values(this.elements)) {
            element.onFlowPropertiesChanged?.(flow.properties);
          }
        }

        if (Object.keys(context).length > 0) {
          for (const element of flow.elements || []) {
            context = { ...context, name: element.name };
            this.elements?.[element.id]?.onContextChanged(context);
          }
        }
        for (const element of flow.elements || []) {
          this.elements?.[element.id]?.onPropertiesChanged(element.properties);
        }

        const statusEvent = {
          eventId: uuid(),
          eventTime: new Date().toISOString(),
          eventType: 'com.hahnpro.event.health',
          contentType: 'application/json',
          data: { deploymentId: this.context.deploymentId, status: 'updated' },
        };
        this.amqpConnection?.publish('deployment', 'health', statusEvent).catch((err) => this.logger.error(err));
      } catch (err) {
        this.logger.error(err);

        const statusEvent = {
          eventId: uuid(),
          eventTime: new Date().toISOString(),
          eventType: 'com.hahnpro.event.health',
          contentType: 'application/json',
          data: { deploymentId: this.context.deploymentId, status: 'updating failed' },
        };
        this.amqpConnection?.publish('deployment', 'health', statusEvent).catch((err) => this.logger.error(err));
      }
    } else if (event.type === 'com.flowstudio.deployment.message') {
      const data = event.data as DeploymentMessage;
      const elementId = data?.elementId;
      if (elementId) {
        this.elements?.[elementId]?.onMessage?.(data);
      } else {
        for (const element of Object.values(this.elements)) {
          element?.onMessage?.(data);
        }
      }
    } else if (event.type === 'com.flowstudio.deployment.destroy') {
      this.destroy();
    } else {
      return new Nack(false);
    }
    return undefined;
  };

  public publishEvent = (event: FlowEvent): Promise<void> => {
    if (!this.amqpConnection) {
      return;
    }
    try {
      const message = event.format();
      if (sizeof(message) > MAX_EVENT_SIZE_BYTES) {
        message.data = this.truncate(message.data);
      }
      return this.amqpConnection.publish('flowlogs', '', message);
    } catch (err) {
      this.logger.error(err);
    }
  };

  get rpcClient() {
    if (!this.amqpConnection?.managedConnection) {
      throw new Error('No AMQP connection available');
    }
    if (!this._rpcClient) {
      this._rpcClient = new RpcClient(this.amqpConnection.managedConnection);
    }
    return this._rpcClient;
  }

  public async destroy() {
    for (const element of Object.values(this.elements)) {
      element?.onDestroy?.();
    }
    await this._rpcClient?.close();
  }

  private getOutputStream(id: string) {
    const stream = this.outputStreamMap[id];
    if (!stream) {
      this.outputStreamMap[id] = new Subject<FlowEvent>();
      return this.outputStreamMap[id];
    }
    return stream;
  }

  private truncate(msg: any): string {
    let truncated = inspect(msg, { depth: 4, maxStringLength: 1000 });
    if (truncated.startsWith("'") && truncated.endsWith("'")) {
      truncated = truncated.substring(1, truncated.length - 1);
    }
    return truncated;
  }
}

export interface Context extends FlowElementContext {
  app?: FlowApplication;
  logger?: Logger;
}
