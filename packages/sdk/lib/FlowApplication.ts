import 'reflect-metadata';

import type { CloudEvent } from 'cloudevents';
import sizeof from 'object-sizeof';
import { EventLoopUtilization, performance } from 'perf_hooks';
import { PartialObserver, Subject } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { API } from '@hahnpro/hpc-api';

import { AmqpConnection, Nack } from './amqp';
import { delay, truncate } from './utils';
import type { ClassType, DeploymentMessage, Flow, FlowContext, FlowElementContext, StreamOptions } from './flow.interface';
import type { FlowElement } from './FlowElement';
import type { FlowEvent } from './FlowEvent';
import { FlowLogger, Logger } from './FlowLogger';
import { RpcClient } from './RpcClient';

const MAX_EVENT_SIZE_BYTES = +process.env.MAX_EVENT_SIZE_BYTES || 512 * 1024; // 512kb
const WARN_EVENT_PROCESSING_SEC = +process.env.WARN_EVENT_PROCESSING_SEC || 60;
const WARN_EVENT_QUEUE_SIZE = +process.env.WARN_EVENT_QUEUE_SIZE || 100;

interface QueueMetrics {
  size: number;
  lastAdd: number;
  lastRemove: number;
  warnings: number;
}

export class FlowApplication {
  public api: API;
  private context: FlowContext;
  private declarations: Record<string, ClassType<FlowElement>> = {};
  private elements: Record<string, FlowElement> = {};
  private logger: Logger;
  private outputStreamMap = new Map<string, Subject<FlowEvent>>();
  private outputQueueMetrics = new Map<string, QueueMetrics>();
  private performanceMap = new Map<string, EventLoopUtilization>();
  private properties: Record<string, any>;
  private _rpcClient: RpcClient;

  constructor(modules: ClassType<any>[], flow: Flow, logger?: Logger, private amqpConnection?: AmqpConnection, skipApi = false) {
    this.logger = new FlowLogger({ id: 'none', functionFqn: 'FlowApplication', ...flow?.context }, logger || undefined, this.publishEvent);

    process.once('uncaughtException', (err) => {
      this.logger.error('Uncaught exception!');
      this.logger.error(err);
      this.destroy(1);
    });
    process.on('unhandledRejection', (reason) => {
      this.logger.error('Unhandled promise rejection!');
      this.logger.error(reason);
    });
    process.on('SIGTERM', () => {
      this.logger.log('Flow Deployment is terminating');
      this.destroy(0);
    });

    this.init(flow, modules, logger, skipApi);
  }

  private async init(flow: Flow, modules: ClassType<any>[], logger: Logger, skipApi: boolean) {
    this.context = { ...flow.context };
    this.properties = flow.properties || {};

    try {
      if (!skipApi) {
        this.api = new API();
      }
    } catch (err) {
      this.logger.error(err?.message || err);
    }

    const logErrorAndExit = (err: string) => {
      this.logger.error(new Error(err));
      this.destroy(1);
    };

    if (this.amqpConnection) {
      try {
        await this.amqpConnection.managedChannel.assertExchange('deployment', 'direct', { durable: true });
        await this.amqpConnection.managedChannel.assertExchange('flowlogs', 'fanout', { durable: true });
      } catch (e) {
        logErrorAndExit(`Could not assert exchanges: ${e}`);
        return;
      }

      try {
        await this.amqpConnection.createSubscriber((msg: any) => this.onMessage(msg), {
          exchange: 'deployment',
          routingKey: this.context.deploymentId,
          queueOptions: { durable: false, exclusive: true },
        });
      } catch (err) {
        logErrorAndExit(`Could not subscribe to deployment exchange: ${err}`);
        return;
      }
    }

    for (const module of modules) {
      const moduleName = Reflect.getMetadata('module:name', module);
      const moduleDeclarations = Reflect.getMetadata('module:declarations', module);
      if (!moduleName || !moduleDeclarations || !Array.isArray(moduleDeclarations)) {
        logErrorAndExit(`FlowModule (${module.name}) metadata is missing or invalid`);
        return;
      }
      for (const declaration of moduleDeclarations) {
        const functionFqn = Reflect.getMetadata('element:functionFqn', declaration);
        if (!functionFqn) {
          logErrorAndExit(`FlowFunction (${declaration.name}) metadata is missing or invalid`);
          return;
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
        logErrorAndExit(`Could not create FlowElement for ${module}.${functionFqn}`);
        return;
      }
    }

    for (const connection of flow.connections) {
      const { source, target, sourceStream = 'default', targetStream = 'default' } = connection;
      if (!source || !target) {
        continue;
      }

      const sourceStreamId = `${source}.${sourceStream}`;
      const targetStreamId = `${target}.${targetStream}`;
      const element = this.elements[target];

      if (!element || !element.constructor) {
        logErrorAndExit(`${target} has not been initialized`);
        return;
      }
      const streamHandler = Reflect.getMetadata(`stream:${targetStream}`, element.constructor);
      if (!streamHandler || !element[streamHandler]) {
        logErrorAndExit(`${target} does not implement a handler for ${targetStream}`);
        return;
      }

      const streamOptions: StreamOptions = Reflect.getMetadata(`stream:options:${targetStream}`, element.constructor) || {};
      const concurrent = streamOptions.concurrent || 1;

      const outputStream = this.getOutputStream(sourceStreamId);
      outputStream
        .pipe(
          tap(() => this.setQueueMetrics(targetStreamId)),
          mergeMap(async (event: FlowEvent) => {
            this.performanceMap.set(event.getId(), performance.eventLoopUtilization());
            try {
              await element[streamHandler](event);
            } catch (err) {
              try {
                element.handleApiError(err);
              } catch (e) {
                this.logger.error(err);
              }
            }
            return event;
          }, concurrent),
          tap((event: FlowEvent) => {
            this.updateMetrics(targetStreamId);
            let elu = this.performanceMap.get(event.getId());
            if (elu) {
              this.performanceMap.delete(event.getId());
              elu = performance.eventLoopUtilization(elu);
              if (elu.utilization > 0.7 && elu.active > 1000) {
                this.logger.warn(
                  `High event loop utilization detected for ${targetStreamId} with event ${event.getId()}! Handler has been active for ${Number(
                    elu.active,
                  ).toFixed(2)}ms with a utilization of ${Number(elu.utilization * 100).toFixed(
                    2,
                  )}%. Consider refactoring or move tasks to a worker thread.`,
                );
              }
            }
          }),
        )
        .subscribe();
    }

    this.logger.log('Flow Deployment is running');
  }

  private setQueueMetrics = (id: string) => {
    const metrics = this.outputQueueMetrics.get(id) || { size: 0, lastAdd: 0, lastRemove: Date.now(), warnings: 0 };
    const secsProcessing = Math.round((metrics.lastAdd - metrics.lastRemove) / 1000);
    metrics.size++;
    metrics.lastAdd = Date.now();

    if (secsProcessing >= WARN_EVENT_PROCESSING_SEC * (metrics.warnings + 1)) {
      this.logger.warn(
        `Input stream "${id}" has ${metrics.size} queued events and the last event has been processing for ${secsProcessing}s`,
      );
      metrics.warnings++;
    } else if (metrics.size % WARN_EVENT_QUEUE_SIZE === 0) {
      this.logger.warn(`Input stream "${id}" has ${metrics.size} queued events`);
    }
    this.outputQueueMetrics.set(id, metrics);
  };

  private updateMetrics = (id: string) => {
    const metrics = this.outputQueueMetrics.get(id);
    if (metrics) {
      metrics.size = metrics.size > 0 ? metrics.size - 1 : 0;
      metrics.lastRemove = Date.now();
      metrics.warnings = 0;
      this.outputQueueMetrics.set(id, metrics);
    }
  };

  public subscribe = (streamId: string, observer: PartialObserver<FlowEvent>) => this.getOutputStream(streamId).subscribe(observer);

  public emit = (event: FlowEvent) => {
    if (event) {
      try {
        this.publishEvent(event);
        if (this.outputStreamMap.has(event.getStreamId())) {
          this.getOutputStream(event.getStreamId()).next(event);
        }
      } catch (err) {
        this.logger.error(err);
      }
    }
  };

  public emitPartial = (completeEvent: FlowEvent, partialEvent: FlowEvent) => {
    // send complete event, log only partial event
    try {
      if (completeEvent && this.outputStreamMap.has(completeEvent.getStreamId())) {
        this.getOutputStream(completeEvent.getStreamId()).next(completeEvent);
      }
      if (partialEvent) {
        this.publishEvent(partialEvent);
      }
    } catch (err) {
      this.logger.error(err);
    }
  };

  public getProperties() {
    return this.properties;
  }

  public onMessage = async (event: CloudEvent<any>): Promise<Nack | undefined> => {
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

  /**
   * Publish a flow event to the amqp flowlogs exchange.
   * If the event size exceeds the limit it will be truncated
   */
  public publishEvent = (event: FlowEvent): Promise<void> => {
    if (!this.amqpConnection) {
      return;
    }
    try {
      const message = event.format();
      if (sizeof(message) > MAX_EVENT_SIZE_BYTES) {
        message.data = truncate(message.data);
      }
      return this.amqpConnection.publish('flowlogs', '', message);
    } catch (err) {
      this.logger.error(err);
    }
  };

  get rpcClient() {
    return (async () => {
      if (!this.amqpConnection?.managedConnection) {
        throw new Error('No AMQP connection available');
      }
      if (!this._rpcClient) {
        this._rpcClient = new RpcClient(this.amqpConnection.managedConnection);
        await this._rpcClient.init();
      }
      return this._rpcClient;
    })();
  }

  /**
   * Calls onDestroy lifecycle method on all flow elements,
   * closes amqp connection after allowing logs to be processed and published
   * then exits process
   */
  public async destroy(exitCode = 0) {
    try {
      try {
        for (const element of Object.values(this.elements)) {
          element?.onDestroy?.();
        }
        await this._rpcClient?.close();
      } catch (err) {
        this.logger.error(err);
      }
      // allow time for logs to be processed
      await delay(250);
      await this.amqpConnection?.managedConnection?.close();
    } catch (err) {
      /* eslint-disable-next-line no-console */
      console.error(err);
    } finally {
      if (process.env.JEST_WORKER_ID == undefined || process.env.NODE_ENV !== 'test') {
        process.exit(exitCode);
      }
    }
  }

  /**
   * Returns rxjs subject for the specified stream id.
   * A new subject will be created if one doesn't exist yet.
   */
  private getOutputStream(id: string) {
    const stream = this.outputStreamMap.get(id);
    if (!stream) {
      this.outputStreamMap.set(id, new Subject<FlowEvent>());
      return this.outputStreamMap.get(id);
    }
    return stream;
  }
}

export interface Context extends FlowElementContext {
  app?: FlowApplication;
  logger?: Logger;
}
