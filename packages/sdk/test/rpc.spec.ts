import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { join } from 'path';

import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';

/* eslint-disable no-console */
describe('Flow RPC', () => {
  let flowApp: FlowApplication;

  beforeAll(async () => {
    const flow = {
      elements: [{ id: 'testResource', module: 'test.module', functionFqn: 'test.resource.TestResource' }],
      connections: [
        { id: 'testConnection1', source: 'testTrigger', sourceStream: 'a', target: 'testResource', targetStream: 'a' },
        { id: 'testConnection1', source: 'testTrigger', sourceStream: 'b', target: 'testResource', targetStream: 'b' },
        { id: 'testConnection1', source: 'testTrigger', sourceStream: 'c', target: 'testResource', targetStream: 'c' },
        { id: 'testConnection1', source: 'testTrigger', sourceStream: 'd', target: 'testResource', targetStream: 'd' },
        { id: 'testConnection1', source: 'testTrigger', sourceStream: 'e', target: 'testResource', targetStream: 'e' },
      ],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    const amqpConnection = new AmqpConnection({ uri: 'amqp://localhost' });
    await amqpConnection.init();
    flowApp = new FlowApplication([TestModule], flow, null, amqpConnection, true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  test('FLOW.RPC.1 publish message', (done) => {
    flowApp.subscribe('testResource.a', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual('foo');
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}, 'a'));
  }, 60000);

  test('FLOW.RPC.2 return sent value', (done) => {
    flowApp.subscribe('testResource.b', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual('bar');
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, { value: 'bar' }, 'b'));
  }, 60000);

  test('FLOW.RPC.3 error in remote procedure', (done) => {
    flowApp.subscribe('testResource.c', {
      next: (event: FlowEvent) => {
        expect(event.getData().err).toBeDefined();
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}, 'c'));
  }, 60000);

  test('FLOW.RPC.4 should return argument', (done) => {
    flowApp.subscribe('testResource.d', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual('10');
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}, 'd'));
  }, 60000);

  test('FLOW.RPC.5 rpc function does not exist', (done) => {
    flowApp.subscribe('testResource.e', {
      next: (event: FlowEvent) => {
        expect(event.getData().err).toBeDefined();
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}, 'e'));
  }, 60000);

  afterAll(async () => {
    await flowApp.destroy();
  });
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  constructor(context) {
    super(context);
    this.runPyRpcScript(join(__dirname, 'rpc.test.py'), 10);
  }

  @InputStream('a')
  public async onA(event) {
    this.callRpcFunction('testA')
      .then((res: any) => this.emitOutput(res, 'a'))
      .catch((err) => this.logger.error(err));
  }

  @InputStream('b')
  public async onB(event) {
    this.callRpcFunction('testB', 'bar')
      .then((res: any) => this.emitOutput(res, 'b'))
      .catch((err) => this.logger.error(err));
  }

  @InputStream('c')
  public async onC(event) {
    this.callRpcFunction('testC')
      .then((res: any) => this.emitOutput(res, 'c'))
      .catch((err) => this.emitOutput({ err }, 'c'));
  }

  @InputStream('d')
  public async onD(event) {
    this.callRpcFunction('testD')
      .then((res: any) => this.emitOutput(res, 'd'))
      .catch((err) => this.emitOutput({ err }, 'd'));
  }

  @InputStream('e')
  public async onE(event) {
    this.callRpcFunction('testE')
      .then((res: any) => this.emitOutput(res, 'e'))
      .catch((err) => {
        this.logger.error(err);
        this.emitOutput({ err }, 'e');
      });
  }
}

@FlowModule({
  name: 'test.module',
  declarations: [TestResource],
})
class TestModule {}
