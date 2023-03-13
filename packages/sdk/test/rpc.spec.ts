import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { join } from 'path';

import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, InputStream } from '../lib';

/* eslint-disable no-console */
describe('Flow RPC', () => {
  let flowApp: FlowApplication;

  beforeAll(async () => {
    const flow = {
      elements: [
        { id: 'testResource', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'testResource2', module: 'test-module', functionFqn: 'test.resource.TestResource' },
      ],
      connections: [
        { id: 'testConnection1', source: 'testTrigger', sourceStream: 'a', target: 'testResource', targetStream: 'a' },
        { id: 'testConnection2', source: 'testTrigger', sourceStream: 'b', target: 'testResource2', targetStream: 'b' },
        { id: 'testConnection1', source: 'testTrigger', sourceStream: 'b', target: 'testResource', targetStream: 'b' },
        { id: 'testConnection1', source: 'testTrigger', sourceStream: 'c', target: 'testResource', targetStream: 'c' },
        { id: 'testConnection1', source: 'testTrigger', sourceStream: 'd', target: 'testResource', targetStream: 'd' },
        { id: 'testConnection1', source: 'testTrigger', sourceStream: 'e', target: 'testResource', targetStream: 'e' },
        { id: 'testConnection1', source: 'testTrigger', sourceStream: 'f', target: 'testResource', targetStream: 'f' },
      ],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    const amqpConnection = new AmqpConnection({ uri: 'amqp://localhost' });
    await amqpConnection.init();
    flowApp = new FlowApplication([TestModule], flow, null, amqpConnection, true, true);
    await flowApp.init();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  test('FLOW.RPC.1 publish message', (done) => {
    flowApp.subscribe('testResource.a', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ res: 'foo' });
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}, 'a'));
  });

  test('FLOW.RPC.2 return sent value', (done) => {
    flowApp.subscribe('testResource.b', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual(expect.objectContaining({ res: 'bar' }));
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, { value: 'bar' }, 'b'));
  });

  test('FLOW.RPC.3 error in remote procedure', (done) => {
    flowApp.subscribe('testResource.c', {
      next: (event: FlowEvent) => {
        expect(event.getData().err).toBeDefined();
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}, 'c'));
  });

  test('FLOW.RPC.4 should return argument', (done) => {
    flowApp.subscribe('testResource.d', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ res: '10' });
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}, 'd'));
  });

  test('FLOW.RPC.5 rpc function does not exist', (done) => {
    flowApp.subscribe('testResource.e', {
      next: (event: FlowEvent) => {
        expect(event.getData().err).toBeDefined();
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}, 'e'));
  });

  test('FLOW.RPC.6 rpc function returns numpy object', (done) => {
    flowApp.subscribe('testResource.f', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ res: '100000000' });
        done();
      },
    });

    flowApp.emit(
      new FlowEvent(
        { id: 'testTrigger' },
        {
          powers: [
            { timestamp: 1234, powers: 567 },
            { timestamp: 89, powers: 1011 },
          ],
        },
        'f',
      ),
    );
  }, 60000);

  afterAll(async () => {
    await flowApp.destroy();
  });
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  constructor(context) {
    super(context);
    const shell = this.runPyRpcScript(join(__dirname, 'rpc.test.py'), 10);
    shell.on('error', (error) => console.log(error));
    shell.on('pythonError', (error) => console.log(error));
    shell.on('stderr', (error) => console.log(error));
    shell.on('message', (error) => console.log(error));
  }

  @InputStream('a')
  public async onA(event) {
    this.callRpcFunction('testA')
      .then((res: any) => {
        this.emitEvent({ res }, event, 'a');
      })
      .catch((err) => console.error(err));
  }

  @InputStream('b')
  public async onB(event) {
    this.callRpcFunction('testB', 'bar')
      .then((res: any) => this.emitEvent({ res }, event, 'b'))
      .catch((err) => this.logger.error(err));
  }

  @InputStream('c')
  public async onC(event) {
    this.callRpcFunction('testC')
      .then((res: any) => this.emitEvent({ res }, event, 'c'))
      .catch((err) => this.emitEvent({ err }, event, 'c'));
  }

  @InputStream('d')
  public async onD(event) {
    this.callRpcFunction('testD')
      .then((res: any) => this.emitEvent({ res }, event, 'd'))
      .catch((err) => this.emitEvent({ err }, event, 'd'));
  }

  @InputStream('e')
  public async onE(event) {
    this.callRpcFunction('testE')
      .then((res: any) => this.emitEvent({ res }, event, 'e'))
      .catch((err) => {
        this.logger.error(err);
        this.emitEvent({ err }, event, 'e');
      });
  }

  @InputStream('f')
  public async onF(event) {
    this.callRpcFunction('testF')
      .then((res: any) => this.emitOutput({ res }, 'f'))
      .catch((err) => {
        this.logger.error(err);
        this.emitOutput({ err }, 'f');
      });
  }
}

@FlowModule({
  name: 'test-module',
  declarations: [TestResource],
})
class TestModule {}
