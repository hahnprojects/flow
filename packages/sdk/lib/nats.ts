import { ConnectionOptions, NatsConnection } from '@nats-io/nats-core';
import { connect } from '@nats-io/transport-node';
import { CloudEvent } from 'cloudevents';
import {
  AckPolicy,
  Consumer,
  ConsumerConfig,
  DeliverPolicy,
  jetstream,
  JetStreamApiError,
  jetstreamManager,
  PubAck,
  ReplayPolicy,
} from '@nats-io/jetstream';
import { Logger } from './FlowLogger';
import { isEqual, omitBy } from 'lodash';

export type NatsEvent<T> = Pick<CloudEvent<T>, 'type' | 'source' | 'subject' | 'data' | 'datacontenttype' | 'time'>;

export const natsFlowsPrefixFlowDeployment = `fs.flowdeployment`;

// https://docs.nats.io/nats-concepts/jetstream/consumers#configuration
export const defaultConsumerConfig: ConsumerConfig = {
  ack_policy: AckPolicy.Explicit,
  ack_wait: 30_000_000_000, // 30 seconds
  deliver_policy: DeliverPolicy.All,
  max_ack_pending: 1000,
  max_deliver: -1,
  max_waiting: 512,
  replay_policy: ReplayPolicy.Instant,
  num_replicas: 0,
};

export const FLOWS_STREAM_NAME = 'flows';

export async function getOrCreateConsumer(
  logger: Logger,
  natsConnection: NatsConnection,
  streamName: string,
  consumerName: string,
  options: Partial<ConsumerConfig>,
): Promise<Consumer> {
  if (!natsConnection || natsConnection.isClosed()) {
    throw new Error('NATS connection is not available');
  } else if (!streamName) {
    throw new Error('Stream name is not available');
  } else if (!consumerName) {
    throw new Error('Consumer name is not available');
  }
  logger.debug(`Creating consumer ${consumerName} for stream ${streamName}`);

  const jsm = await jetstreamManager(natsConnection);
  const consumerInfo = await jsm.consumers.info(streamName, consumerName).catch((err: JetStreamApiError) => {
    if (err.status !== 404) {
      logger.error(`Could not get consumer info of stream ${streamName}`, err);
      logger.error(err.message);
      throw err;
    }
  });

  const consumerConfig = { ...defaultConsumerConfig, ...options };
  if (consumerInfo) {
    const compared = omitBy(consumerConfig, (value, key) => isEqual(value, consumerInfo.config[key]));
    if (Object.keys(compared).length !== 0) {
      await jsm.consumers.update(streamName, consumerName, consumerConfig);
    }
  } else {
    await jsm.consumers.add(streamName, { name: consumerName, ...consumerConfig });
  }
  return await jetstream(natsConnection).consumers.get(streamName, consumerName);
}

export async function natsEventListener(nc: NatsConnection, logger: Logger, reconnectHandler: () => void): Promise<void> {
  const statusAsyncIterator = nc?.status();
  if (!statusAsyncIterator) {
    logger.error('NATS Status-AsyncIterator is not available, cannot listen for events to re-create consumers at reconnects');
    return;
  }

  for await (const status of statusAsyncIterator) {
    logger.debug(`[NatsConsumerService] ${status.type}`);

    // Handle reconnect: event is triggered when the NATS client reconnected to the server
    if (status.type === 'reconnect') {
      reconnectHandler();
    }
  }
}

export async function publishNatsEvent<T>(logger: Logger, nc: NatsConnection, event: NatsEvent<T>, subject?: string): Promise<PubAck> {
  if (!nc || nc.isClosed()) {
    return;
  }
  const cloudEvent = new CloudEvent<T>({ datacontenttype: 'application/json', ...event });
  cloudEvent.validate();
  const js = jetstream(nc);
  if (js) {
    return js.publish(subject || `${cloudEvent.type}.${cloudEvent.subject}`, JSON.stringify(cloudEvent.toJSON()), {
      msgID: cloudEvent.id,
    });
  } else {
    logger.error(`Could not publish nats event, because jetstream is unavailable / undefined`);
  }
}

export async function createNatsConnection(config: ConnectionOptions): Promise<NatsConnection> {
  const servers: string | string[] = config?.servers ?? process.env.NATS_SERVERS?.split(',') ?? [];
  const reconnect: boolean = config?.reconnect ?? (process.env.NATS_RECONNECT ?? 'true') === 'true';

  // Default maxReconnectAttempts is 10
  let maxReconnectAttempts: number = config?.maxReconnectAttempts ?? parseInt(process.env.NATS_MAX_RECONNECT_ATTEMPTS ?? '10', 10);
  if (isNaN(maxReconnectAttempts)) {
    maxReconnectAttempts = 10;
  }

  // Default reconnectTimeWait is 2000ms
  let reconnectTimeWait: number = config?.reconnectTimeWait ?? parseInt(process.env.NATS_RECONNECT_TIME_WAIT ?? '2000', 10);
  if (isNaN(reconnectTimeWait)) {
    reconnectTimeWait = 2000;
  }

  // Default timeout is 2000ms
  let timeout: number = config?.timeout ?? parseInt(process.env.NATS_TIMEOUT ?? '2000', 10);
  if (isNaN(timeout)) {
    timeout = 2000;
  }

  const options: ConnectionOptions = {
    servers,
    reconnect,
    maxReconnectAttempts, // <-- maxReconnectAttempts: -1 means infinite reconnect attempts
    reconnectTimeWait, // <-- reconnectTimeWait: -1 means no wait time between reconnect attempts
    timeout,
    user: config?.user ?? process.env.NATS_USER,
    pass: config.pass ?? process.env.NATS_PASSWORD,
  };

  return connect(options);
}
