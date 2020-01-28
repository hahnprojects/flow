import EventEmitter from 'eventemitter3';
import 'reflect-metadata';

import { API } from './api';
import { FlowElement } from './FlowElement';
import { FlowEvent } from './FlowEvent';
import { FlowLogger, Logger } from './FlowLogger';
import { Queue, QueueOptions } from './Queue';
import { handleApiError } from './utils';

export class FlowApplication {
  private declarations: { [id: string]: ClassType<FlowElement> } = {};
  private elements: { [id: string]: FlowElement } = {};
  private emitter = new EventEmitter();
  private queues: { [id: string]: Queue } = {};

  constructor(modules: Array<ClassType<any>>, flow: Flow) {
    const defaultLogger = new FlowLogger({ id: 'default' });

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
      this.elements[id] = new this.declarations[`${module}.${functionFqn}`]({ ...flow.context, id, name, app: this }, properties);
    }

    for (const connection of flow.connections) {
      const { source, target, sourceStream = 'default', targetStream = 'default' } = connection;
      if (!source || !target) {
        continue;
      }

      const id = `${source}.${sourceStream}`;
      const element = this.elements[target];

      if (!element || !element.constructor) {
        throw new Error(target + ' has not been initialized');
      }
      const streamHandler = Reflect.getMetadata(`stream:${targetStream}`, element.constructor);
      if (!streamHandler || !element[streamHandler]) {
        throw new Error(`${target} does not implement a handler for ${targetStream}`);
      }

      const streamOptions: QueueOptions = Reflect.getMetadata(`stream:options:${targetStream}`, element.constructor) || {};
      let queue: Queue;
      if (streamOptions.concurrent) {
        queue = this.getQueue(`${target}:${targetStream}`, streamOptions);
      } else {
        const elementOptions: QueueOptions = Reflect.getMetadata('element:options', element.constructor) || {};
        elementOptions.concurrent = elementOptions.concurrent || 1;
        queue = this.getQueue(target, elementOptions);
      }

      this.emitter.on(id, (event: FlowEvent) =>
        queue.add(async () => {
          try {
            return element[streamHandler](event, targetStream);
          } catch (err) {
            handleApiError(err, defaultLogger);
          }
        }),
      );
    }
  }

  public addListener = (id: string, listener: (event: FlowEvent) => void) => this.emitter.on(id, listener);

  public emit = (id: string, event: FlowEvent) => this.emitter.emit(id, event);

  public getQueueStats(id?: string) {
    if (id) {
      return this.queues[id].getStats();
    }
    const stats = {};
    for (const key of Object.keys(this.queues)) {
      stats[key] = this.queues[key].getStats();
    }
    return stats;
  }

  private getQueue(id: string, options: QueueOptions = {}): Queue {
    const queue = this.queues[id];
    if (!queue) {
      options.concurrent = options.concurrent || 1;
      this.queues[id] = new Queue(options);
      return this.queues[id];
    }
    return queue;
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
    logger?: Logger;
    logEvents?: boolean;
  };
}

export interface FlowContext {
  app: FlowApplication;
  api?: API;
  logger?: Logger;
  logEvents?: boolean;
}

type ClassType<T> = new (...args: any[]) => T;
