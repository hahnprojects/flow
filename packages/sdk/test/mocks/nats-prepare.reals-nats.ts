import { connect } from '@nats-io/transport-node';
import { jetstreamManager } from '@nats-io/jetstream';
import { Logger } from '../../lib';
import { NatsConnection } from '@nats-io/nats-core';

export async function natsPrepareForRealNats(logger: Logger): Promise<NatsConnection> {
  const natsConnection = await connect();
  const jsm = await jetstreamManager(natsConnection);
  const flowStream = await jsm.streams.info('flows').catch((err: any) => logger.error(err));
  if (!flowStream) {
    await jsm.streams.add({ name: 'flows', subjects: ['fs.>'] }).catch((err: any) => logger.error(err));
  }
  return natsConnection;
}
