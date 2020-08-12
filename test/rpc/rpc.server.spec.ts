import { RPCServer, RemoteProcedure, remoteProcedures } from '../../src/rpc/server/node';

process.env.RPC_QUEUE = 'rpc_queue';

class Test {
  @RemoteProcedure()
  private test() {}
}

describe('typescript rpc server', () => {
  it('should instantiate the Server if the decorator is used', async () => {
    const server = await RPCServer.getInstance('rpc');
    expect(remoteProcedures.size).toEqual(1);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await server.close();
  });
});
