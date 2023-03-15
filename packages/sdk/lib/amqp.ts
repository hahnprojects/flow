import { AmqpConnectionManager, ChannelWrapper, connect } from 'amqp-connection-manager';

export interface AmqpConnection {
  managedChannel: ChannelWrapper;
  managedConnection: AmqpConnectionManager;
}

export interface AmqpConnectionConfig {
  protocol?: string;
  hostname?: string;
  vhost?: string;
  user?: string;
  password?: string;
  port?: number;
}

export function createAmqpConnection(config: AmqpConnectionConfig): AmqpConnectionManager {
  if (!config) {
    return;
  }

  const {
    protocol = process.env.RABBIT_PROTOCOL || 'amqp',
    hostname = process.env.RABBIT_HOST || 'localhost',
    port = +process.env.RABBIT_PORT || 5672,
    user = process.env.RABBIT_USER || 'guest',
    password = process.env.RABBIT_PASSWORD || 'guest',
    vhost = process.env.RABBIT_VHOST || '',
  } = config;
  const uri = `${protocol}://${user}:${password}@${hostname}:${port}${vhost ? '/' + vhost : ''}`;
  return connect(uri);
}

export class Nack {
  constructor(private readonly _requeue: boolean = false) {}

  get requeue() {
    return this._requeue;
  }
}
