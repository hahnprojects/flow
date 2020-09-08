import 'reflect-metadata';

import { AmqpConnectionManager } from 'amqp-connection-manager';
import { PartialObserver, Subject } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';

import { API } from './api';
import { FlowElement } from './FlowElement';
import { FlowEvent } from './FlowEvent';
import { Logger } from './FlowLogger';
import { RpcClient } from './RpcClient';

/* tslint:disable:no-console */
export class FlowApplication {
  private context: FlowContext;
  private declarations: { [id: string]: ClassType<FlowElement> } = {};
  private elements: { [id: string]: FlowElement } = {};
  private _rpcClient: RpcClient;

  private outputStreamMap: {
    [streamId: string]: Subject<FlowEvent>;
  } = {};

  constructor(modules: Array<ClassType<any>>, flow: Flow) {
    this.context = { ...flow.context, app: this };

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
        this.elements[id] = new this.declarations[`${module}.${functionFqn}`]({ ...this.context, id, name }, properties);
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
  }

  public subscribe = (streamId: string, observer: PartialObserver<FlowEvent>) => this.getOutputStream(streamId).subscribe(observer);

  public emit = (event: FlowEvent) => {
    if (event) {
      try {
        this.getOutputStream(event.getStreamId()).next(event);
      } catch (err) {
        this.context?.logger?.error(err);
      }

      if (this.context.publishEvent && event.getDataContentType() === 'application/json') {
        const size = Buffer.byteLength(event.toString());
        if (size <= 64 * 1024 /* 64kb */) {
          this.context.publishEvent(event).catch((err) => this.context?.logger?.error(err));
        }
      }
    }
  };

  public publishMessage = (msg: any, elementId?: string) => {
    if (elementId) {
      const element = this.elements[elementId];
      if (element?.handleMessage) {
        element.handleMessage(msg);
      }
    } else {
      for (const element of Object.values(this.elements)) {
        if (element?.handleMessage) {
          element.handleMessage(msg);
        }
      }
    }
  };

  get rpcClient() {
    if (!this._rpcClient) {
      this._rpcClient = new RpcClient(this.context.amqpConnection);
    }
    return this._rpcClient;
  }

  public async destroy() {
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
}

export interface Flow {
  elements: Array<{
    id: string;
    name?: string;
    properties?: unknown;
    module: string;
    functionFqn: string;
  }>;
  connections: Array<{
    id: string;
    name?: string;
    source: string;
    target: string;
    sourceStream?: string;
    targetStream?: string;
  }>;
  context?: {
    api?: API;
    deploymentId?: string;
    diagramId?: string;
    flowId?: string;
    logger?: Logger;
    publishEvent?: (event: FlowEvent) => Promise<void>;
    amqpConnection?: AmqpConnectionManager;
  };
}

export interface StreamOptions {
  concurrent?: number;
}

export interface FlowContext {
  app: any;
  api?: API;
  deploymentId?: string;
  diagramId?: string;
  flowId?: string;
  logger?: Logger;
  publishEvent?: (event: FlowEvent) => Promise<void>;
  amqpConnection?: AmqpConnectionManager;
}

type ClassType<T> = new (...args: any[]) => T;
