import { connect, ConnectionOptions, NatsConnection } from 'nats';

export async function createNatsConnection(config: ConnectionOptions): Promise<NatsConnection> {
  if (!config) {
    return;
  }
  const servers: string[] = process.env.NATS_SERVERS?.split(',') ?? [];
  const reconnect: boolean = (process.env.NATS_RECONNECT ?? 'true') === 'true';

  // Default maxReconnectAttempts is 10
  let maxReconnectAttempts: number = parseInt(process.env.NATS_MAX_RECONNECT_ATTEMPTS ?? '10', 10);
  if (isNaN(maxReconnectAttempts)) {
    maxReconnectAttempts = 10;
  }

  // Default reconnectTimeWait is 2000ms
  let reconnectTimeWait: number = parseInt(process.env.NATS_RECONNECT_TIME_WAIT ?? '2000', 10);
  if (isNaN(reconnectTimeWait)) {
    reconnectTimeWait = 2000;
  }

  // Default timeout is 2000ms
  let timeout: number = parseInt(process.env.NATS_TIMEOUT ?? '2000', 10);
  if (isNaN(timeout)) {
    timeout = 2000;
  }

  const options: ConnectionOptions = {
    servers,
    reconnect,
    maxReconnectAttempts, // <-- maxReconnectAttempts: -1 means infinite reconnect attempts
    reconnectTimeWait, // <-- reconnectTimeWait: -1 means no wait time between reconnect attempts
    timeout,
    user: process.env.NATS_USER,
    pass: process.env.NATS_PASSWORD,
  };

  return connect(options);
}
