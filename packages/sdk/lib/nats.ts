import { ConnectionOptions, NatsConnection } from '@nats-io/nats-core';
import { connect } from '@nats-io/transport-node';
import { CloudEvent } from 'cloudevents';
import { jetstream, PubAck } from '@nats-io/jetstream';
export type NatsEvent<T> = Pick<CloudEvent<T>, 'type' | 'source' | 'subject' | 'data' | 'datacontenttype' | 'time'>;

export const natsFlowsPrefixFlowDeployment = `com.hahnpro.flows.flowdeployment`;

export async function publishNatsEvent<T>(nc: NatsConnection, event: NatsEvent<T>, subject?: string): Promise<PubAck> {
  const cloudEvent = new CloudEvent<T>({ datacontenttype: 'application/json', ...event });
  cloudEvent.validate();
  return jetstream(nc).publish(subject || `${cloudEvent.type}.${cloudEvent.subject}`, JSON.stringify(cloudEvent.toJSON()), {
    msgID: cloudEvent.id,
  });
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
