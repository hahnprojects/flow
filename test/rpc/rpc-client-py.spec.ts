import { spawn } from 'child_process';
import path from 'path';

import { RPCClient } from '../../src/rpc';

process.env.RPC_ROUTING_KEY = 'rpc';

describe('python rpc server', () => {
  let spawn1;
  beforeAll(async () => {
    spawn1 = spawn(`python`, [path.join(__dirname, '../../src/rpc/server/python/test.py')]);
    spawn1.stderr.on('data', (data: Buffer) => console.log(data.toString()));
    await RPCClient.getInstance('rpc');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }, 60000);

  it('should return static value', async () => {
    const instance = await RPCClient.getInstance('rpc');
    const test = await instance.callFunction('test');
    expect(test).toEqual('funzt');
  });

  it('should return sent value', async () => {
    const instance = await RPCClient.getInstance('rpc');
    const test = await instance.callFunction('test1', 'arg');
    expect(test).toEqual('arg');
  });

  it('should throw error if function does not exist', async () => {
    const client = await RPCClient.getInstance('rpc');

    await expect(client.callFunction('doesNotExist')).rejects.toThrow();
  });

  it('should throw error in remote procedure', async () => {
    const client = await RPCClient.getInstance('rpc');

    await expect(client.callFunction('test3')).rejects.toThrow();
  });

  afterAll(async () => {
    const client = await RPCClient.getInstance('rpc');
    await client.close();
    // spawn1.kill();
  });
});
