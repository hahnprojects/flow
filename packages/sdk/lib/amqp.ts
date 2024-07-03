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

export function createAmqpConnection(config: AmqpConnectionConfig = {}): AmqpConnectionManager {
  const { protocol = 'amqp', hostname = 'localhost', port = 5672, user = 'guest', password = 'guest', vhost } = config;
  const uri = `${protocol}://${user}:${password}@${hostname}:${port}${vhost ? '/' + vhost : ''}`;
  return connect(uri);
}
