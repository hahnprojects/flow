import { RPCClient } from '../../src/rpc';
import { RPCServer, RemoteProcedure } from '../../src/rpc/server/node';

class Test1 {
  @RemoteProcedure()
  procedure1() {
    return 'test';
  }

  @RemoteProcedure()
  procedure2(str: string) {
    return str;
  }

  @RemoteProcedure()
  procedure3() {
    throw new Error('test');
  }
}

describe('RPC', () => {
  beforeAll(async () => {
    await RPCServer.getInstance('rpc');
    await RPCClient.getInstance('rpc');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it('should execute remote function', async () => {
    const client = await RPCClient.getInstance('rpc');

    const callRes = await client.callFunction('procedure1');
    expect(callRes).toEqual('test');
  }, 60000);

  it('should work with declared function', async () => {
    const client = await RPCClient.getInstance('rpc');

    const func = client.declareFunction('procedure1');
    const declaredRes = await func();
    expect(declaredRes).toEqual('test');
  });

  it('should work with declared function with parameters', async () => {
    const client = await RPCClient.getInstance('rpc');

    const func2 = client.declareFunction('procedure2');
    const func2Res = await func2('arg');
    expect(func2Res).toEqual('arg');
  });

  it('should throw error if function does not exist', async () => {
    const client = await RPCClient.getInstance('rpc');

    await expect(client.callFunction('doesNotExist')).rejects.toThrow();
  });

  it('should throw error in remote procedure', async () => {
    const client = await RPCClient.getInstance('rpc');

    await expect(client.callFunction('procedure3')).rejects.toThrow();
  });

  afterAll(async () => {
    const client = await RPCClient.getInstance('rpc');
    const server = await RPCClient.getInstance('rpc');
    await client.close();
    await server.close();
  });
});
