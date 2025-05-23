import 'reflect-metadata';

import { API, HttpClient, MockAPI } from '@hahnpro/hpc-api';
import { NatsConnection, ConnectionOptions as NatsConnectionOptions } from '@nats-io/nats-core';
import { Consumer, ConsumerConfig, ConsumerMessages } from '@nats-io/jetstream';
import { AmqpConnectionManager, Channel, ChannelWrapper } from 'amqp-connection-manager';
import { CloudEvent } from 'cloudevents';
import { cloneDeep } from 'lodash';
import sizeof from 'object-sizeof';
import { EventLoopUtilization, performance } from 'perf_hooks';
import { PartialObserver, Subject } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';

import { AmqpConnection, AmqpConnectionConfig, createAmqpConnection } from './amqp';
import { ClassType, DeploymentMessage, Flow, FlowContext, FlowElementContext, LifecycleEvent, StreamOptions } from './flow.interface';
import type { FlowElement } from './FlowElement';
import { FlowEvent } from './FlowEvent';
import { FlowLogger, Logger } from './FlowLogger';
import { RpcClient } from './RpcClient';
import { delay, truncate } from './utils';
import {
  createNatsConnection,
  defaultConsumerConfig,
  FLOWS_STREAM_NAME,
  getOrCreateConsumer,
  NatsEvent,
  natsFlowsPrefixFlowDeployment,
  publishNatsEvent,
} from './nats';
import { ContextManager } from './ContextManager';

const MAX_EVENT_SIZE_BYTES = +process.env.MAX_EVENT_SIZE_BYTES || 512 * 1024; // 512kb
const WARN_EVENT_PROCESSING_SEC = +process.env.WARN_EVENT_PROCESSING_SEC || 60;
const WARN_EVENT_QUEUE_SIZE = +process.env.WARN_EVENT_QUEUE_SIZE || 100;

interface QueueMetrics {
  size: number;
  lastAdd: number;
  lastRemove: number;
  warnings: number;
}

interface FlowAppConfig {
  logger?: Logger;
  amqpConfig?: AmqpConnectionConfig;
  amqpConnection?: AmqpConnectionManager;
  natsConfig?: NatsConnectionOptions;
  natsConnection?: NatsConnection;
  apiClient?: HttpClient;
  skipApi?: boolean;
  explicitInit?: boolean;
  mockApi?: MockAPI;
}

export class FlowApplication {
  private _api: API;
  private _rpcClient: RpcClient;
  private amqpChannel: ChannelWrapper;
  private readonly amqpConnection: AmqpConnectionManager;
  private readonly natsConnectionConfig?: NatsConnectionOptions;
  private _natsConnection?: NatsConnection;
  private readonly baseLogger: Logger;
  private context: FlowContext;
  private declarations: Record<string, ClassType<FlowElement>> = {};
  private elements: Record<string, FlowElement> = {};
  private initialized = false;
  private readonly logger: FlowLogger;
  private outputStreamMap = new Map<string, Subject<FlowEvent>>();
  private outputQueueMetrics = new Map<string, QueueMetrics>();
  private performanceMap = new Map<string, EventLoopUtilization>();
  private readonly skipApi: boolean;
  private readonly apiClient?: HttpClient;

  private readonly contextManager: ContextManager;
  private natsMessageIterator: ConsumerMessages;

  constructor(modules: ClassType<any>[], flow: Flow, config?: FlowAppConfig);
  constructor(
    modules: ClassType<any>[],
    flow: Flow,
    baseLogger?: Logger,
    amqpConnection?: AmqpConnection,
    natsConnection?: NatsConnection,
    skipApi?: boolean,
    explicitInit?: boolean,
  );
  constructor(
    private modules: ClassType<any>[],
    private flow: Flow,
    baseLoggerOrConfig?: Logger | FlowAppConfig,
    amqpConnection?: AmqpConnection,
    natsConnection?: NatsConnection,
    skipApi?: boolean,
    explicitInit?: boolean,
    mockApi?: MockAPI,
  ) {
    if (baseLoggerOrConfig && !(baseLoggerOrConfig as Logger).log) {
      const config = baseLoggerOrConfig as FlowAppConfig;
      this.baseLogger = config.logger;
      this.amqpConnection = config.amqpConnection || createAmqpConnection(config.amqpConfig);
      this.natsConnectionConfig = config.natsConfig;
      this._natsConnection = config.natsConnection;
      this.skipApi = config.skipApi || false;
      explicitInit = config.explicitInit || false;
      this._api = config.mockApi || null;
      this.apiClient = config.apiClient;
    } else {
      this.baseLogger = baseLoggerOrConfig as Logger;
      this.amqpConnection = amqpConnection?.managedConnection;
      this._natsConnection = natsConnection;
      this.skipApi = skipApi || false;
      explicitInit = explicitInit || false;
      this._api = mockApi || null;
    }

    this.logger = new FlowLogger(
      { id: 'none', functionFqn: 'FlowApplication', ...flow?.context },
      this.baseLogger || undefined,
      this.publishNatsEventFlowlogs,
    );

    this.contextManager = new ContextManager(this.logger, this.flow?.properties);

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

    if (explicitInit !== true) {
      this.init();
    }
  }

  get rpcClient(): RpcClient {
    if (!this._rpcClient && this.amqpConnection) {
      this._rpcClient = new RpcClient(this.amqpConnection, this.logger);
    }
    return this._rpcClient;
  }

  get api(): API {
    return this._api;
  }

  get natsConnection(): NatsConnection {
    return this._natsConnection;
  }

  public getContextManager(): ContextManager {
    return this.contextManager;
  }

  public getProperties() {
    return this.contextManager.getProperties();
  }

  private async consumeNatsMessagesOfConsumer(consumer: Consumer, consumerOptions: Partial<ConsumerConfig>) {
    if (this.natsMessageIterator) {
      await this.natsMessageIterator.close();
    }
    this.natsMessageIterator = await consumer.consume(consumerOptions);
    for await (const msg of this.natsMessageIterator) {
      try {
        let event: CloudEvent;
        try {
          event = new CloudEvent(msg.json());
          event.validate();
        } catch (error) {
          this.logger.error('Message is not a valid CloudEvent and will be discarded');
          msg.ack(); // Acknowledge the message to remove it from the queue
          continue;
        }
        await this.onMessage(event);
        msg.ack();
      } catch (error) {
        this.logger.error('Error processing message');
        this.logger.error(error);
        msg.nak(1000);
      }
    }
  }

  public async init() {
    if (this.initialized) return;

    this.context = { ...this.flow.context };
    this.contextManager.overwriteAllProperties(this.flow.properties ?? {});

    try {
      if (!this.skipApi && !(this._api instanceof MockAPI)) {
        // only create real API if it should not be skipped and is not already a mock
        let tokenSubject: string;
        const { owner, runAsOwner } = this.context;
        if (runAsOwner && owner) {
          tokenSubject = owner.type === 'org' ? 'org-admin-' + owner.id : owner.id;
        }
        this._api = new API(this.apiClient, { tokenSubject });
      }
    } catch (err) {
      this.logger.error(err?.message || err);
    }

    const logErrorAndExit = async (err: string) => {
      this.logger.error(new Error(err));
      await this.destroy(1);
    };

    if (!this._natsConnection && this.natsConnectionConfig) {
      try {
        this._natsConnection = await createNatsConnection(this.natsConnectionConfig);
      } catch (err) {
        await logErrorAndExit(`Could not connect to the NATS-Servers: ${err}`);
      }
    }

    if (this._natsConnection && !this._natsConnection.isClosed() && this.context?.deploymentId !== undefined) {
      try {
        const consumerOptions = {
          ...defaultConsumerConfig,
          name: `flow-deployment-${this.context.deploymentId}`,
          filter_subject: `${natsFlowsPrefixFlowDeployment}.${this.context.deploymentId}.*`,
        };
        const consumer = await getOrCreateConsumer(
          this.logger,
          this._natsConnection,
          FLOWS_STREAM_NAME,
          consumerOptions.name,
          consumerOptions,
        );

        // NO AWAIT: else it will block the init process
        this.consumeNatsMessagesOfConsumer(consumer, consumerOptions);
      } catch (e) {
        await logErrorAndExit(`Could not set up consumer for deployment messages exchanges: ${e}`);
      }
    }

    this.amqpChannel = this.amqpConnection?.createChannel({
      json: true,
      setup: async (channel: Channel) => {
        try {
          await channel.assertExchange('flow', 'direct', { durable: true }); // TODO wieso weshalb warum: wo wird das gebraucht?
        } catch (e) {
          await logErrorAndExit(`Could not assert exchanges: ${e}`);
        }
      },
    });

    if (this.amqpChannel) {
      await this.amqpChannel.waitForConnect();
    }

    for (const module of this.modules) {
      const moduleName = Reflect.getMetadata('module:name', module);
      const moduleDeclarations = Reflect.getMetadata('module:declarations', module);
      if (!moduleName || !moduleDeclarations || !Array.isArray(moduleDeclarations)) {
        await logErrorAndExit(`FlowModule (${module.name}) metadata is missing or invalid`);
        return;
      }
      for (const declaration of moduleDeclarations) {
        const functionFqn = Reflect.getMetadata('element:functionFqn', declaration);
        if (!functionFqn) {
          await logErrorAndExit(`FlowFunction (${declaration.name}) metadata is missing or invalid`);
          return;
        }
        this.declarations[`${moduleName}.${functionFqn}`] = declaration;
      }
    }

    for (const element of this.flow.elements) {
      const { id, name, properties, module, functionFqn } = element;
      try {
        const context: Context = { ...this.context, id, name, logger: this.baseLogger, app: this };
        this.elements[id] = new this.declarations[`${module}.${functionFqn}`](
          context,
          // run recursively through all properties and interpolate them / replace them with their explicit value
          this.contextManager.replaceAllPlaceholderProperties(properties),
        );
        this.elements[id].setPropertiesWithPlaceholders(cloneDeep(properties));
      } catch (err) {
        await logErrorAndExit(`Could not create FlowElement for ${module}.${functionFqn}`);
        return;
      }
    }

    for (const connection of this.flow.connections) {
      const { source, target, sourceStream = 'default', targetStream = 'default' } = connection;
      if (!source || !target) {
        continue;
      }

      const sourceStreamId = `${source}.${sourceStream}`;
      const targetStreamId = `${target}.${targetStream}`;
      const element = this.elements[target];

      if (!element || !element.constructor) {
        await logErrorAndExit(`${target} has not been initialized`);
        return;
      }
      const streamHandler = Reflect.getMetadata(`stream:${targetStream}`, element.constructor);
      if (!streamHandler || !element[streamHandler]) {
        await logErrorAndExit(`${target} does not implement a handler for ${targetStream}`);
        return;
      }

      const streamOptions: StreamOptions = Reflect.getMetadata(`stream:options:${targetStream}`, element.constructor) || {};
      const concurrent = streamOptions.concurrent || 1;

      const outputStream = this.getOutputStream(sourceStreamId);
      outputStream
        .pipe(
          tap(() => this.setQueueMetrics(targetStreamId)),
          mergeMap(async (event: FlowEvent) => {
            const eventId = event.getId();
            this.publishLifecycleEvent(element, eventId, LifecycleEvent.ACTIVATED);
            this.performanceMap.set(eventId, performance.eventLoopUtilization());
            const start = performance.now();
            try {
              await element[streamHandler](event);
              const duration = Math.ceil(performance.now() - start);
              this.publishLifecycleEvent(element, eventId, LifecycleEvent.COMPLETED, { duration });
            } catch (err) {
              const duration = Math.ceil(performance.now() - start);
              this.publishLifecycleEvent(element, eventId, LifecycleEvent.TERMINATED, { duration });
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
              if (elu.utilization > 0.75 && elu.active > 2000) {
                this.logger.warn(
                  `High event loop utilization detected for ${targetStreamId} with event ${event.getId()}! Handler was active for ${Number(
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

    this.initialized = true;
    this.logger.log('Flow Deployment is running');
  }

  private publishLifecycleEvent = async (
    element: FlowElement,
    flowEventId: string,
    eventType: LifecycleEvent,
    data: Record<string, any> = {},
  ) => {
    if (!this.amqpChannel) {
      return;
    }
    try {
      const { flowId, deploymentId, id: elementId, functionFqn, inputStreamId } = element.getMetadata();
      const natsEvent: NatsEvent<any> = {
        source: `flows/${flowId}/deployments/${deploymentId}/elements/${elementId}`,
        type: eventType,
        data: {
          flowEventId,
          functionFqn,
          inputStreamId,
          ...data,
        },
      };
      await publishNatsEvent(this.logger, this.natsConnection, natsEvent, `${natsFlowsPrefixFlowDeployment}.flowlifecycle.${deploymentId}`);
    } catch (err) {
      this.logger.error(err);
    }
  };

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
        this.publishNatsEventFlowlogs(event);
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
        this.publishNatsEventFlowlogs(partialEvent);
      }
    } catch (err) {
      this.logger.error(err);
    }
  };

  public onMessage = async (cloudEvent: CloudEvent) => {
    if (cloudEvent.subject.endsWith('.update')) {
      let event: any;
      try {
        event = JSON.parse(cloudEvent.content.toString());
      } catch (err) {
        this.logger.error(err);
        return;
      }

      try {
        const flow: Flow = event.data;
        if (!flow) {
          return;
        }

        let context: Partial<FlowElementContext> = {};
        if (flow.context) {
          this.context = { ...this.context, ...flow.context };
          context = this.context;
        }

        if (flow.properties) {
          this.contextManager.updateFlowProperties(flow.properties);
          for (const element of Object.values(this.elements)) {
            element.replacePlaceholderAndSetProperties();
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
          this.elements?.[element.id]?.setPropertiesWithPlaceholders(cloneDeep(element.properties));
          this.elements?.[element.id]?.onPropertiesChanged(
            this.contextManager.replaceAllPlaceholderProperties(this.elements[element.id].getPropertiesWithPlaceholders()),
          );
        }

        const natsEvent = {
          source: `hpc/flow-application`,
          type: `${natsFlowsPrefixFlowDeployment}.health`,
          subject: `${this.context.deploymentId}`,
          data: {
            deploymentId: this.context.deploymentId,
            status: 'updated',
          },
        };
        await publishNatsEvent(this.logger, this.natsConnection, natsEvent);
      } catch (err) {
        this.logger.error(err);

        const natsEvent = {
          source: `hpc/flow-application`,
          type: `${natsFlowsPrefixFlowDeployment}.health`,
          subject: `${this.context.deploymentId}`,
          data: {
            deploymentId: this.context.deploymentId,
            status: 'updating failed',
          },
        };
        await publishNatsEvent(this.logger, this.natsConnection, natsEvent);
      }
    } else if (cloudEvent.subject.endsWith('.message')) {
      const data = cloudEvent.data as DeploymentMessage;
      const elementId = data?.elementId;
      if (elementId) {
        this.elements?.[elementId]?.onMessage?.(data);
      } else {
        for (const element of Object.values(this.elements)) {
          element?.onMessage?.(data);
        }
      }
    } else if (cloudEvent.subject.endsWith('.destroy')) {
      // TODO war com.flowstudio.deployment.destroy in RabbitMq: wo wird das jetzt wieder gesendet?
      this.destroy();
    }
  };

  /**
   * Publish a flow event to the amqp flowlogs exchange.
   * If the event size exceeds the limit it will be truncated
   *
   * TODO warum darf hier nicht false zurückgegeben werden? -> erzeugt loop
   */
  public publishNatsEventFlowlogs = async (event: FlowEvent): Promise<boolean> => {
    if (!this.natsConnection || this.natsConnection.isClosed()) {
      return;
    }

    try {
      const message = event.format();
      if (sizeof(message) > MAX_EVENT_SIZE_BYTES) {
        message.data = truncate(message.data);
      }

      const natsEvent = {
        source: `hpc/flow-application`,
        type: `${natsFlowsPrefixFlowDeployment}.flowlogs`,
        subject: `${this.context.deploymentId}`,
        data: message,
      };

      await publishNatsEvent(this.logger, this.natsConnection, natsEvent);
      return true;
    } catch (err) {
      this.logger.error(err);
    }
  };

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
        if (this._rpcClient) {
          await this._rpcClient.close();
        }
      } catch (err) {
        this.logger.error(err);
      }
      // allow time for logs to be processed
      await delay(250);
      if (this.amqpConnection) {
        await this.amqpConnection.close();
      }

      await this._natsConnection?.drain();
      await this.natsMessageIterator?.close();
      await this._natsConnection?.close();
    } catch (err) {
      /* eslint-disable-next-line no-console */
      console.error(err);
    } finally {
      if (process.env.NODE_ENV !== 'test') {
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
