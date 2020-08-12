import { RPCServer, remoteProcedures } from './rpc.server';

export function RemoteProcedure() {
  if (process.env.RPC_QUEUE) {
    // instantiate RPCServer if not yet present
    RPCServer.getInstance(process.env.RPC_QUEUE);
  }
  return (target, propertyKey: string, descriptor: PropertyDescriptor) => {
    remoteProcedures.set(propertyKey, descriptor.value);
  };
}
