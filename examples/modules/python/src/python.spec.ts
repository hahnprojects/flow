import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { FlowApplication, FlowEvent } from '@hahnpro/flow-sdk';

import PythonModule from '../';

// tslint:disable:no-console
describe('Python', () => {
  let flowApp: FlowApplication;

  beforeAll(async () => {
    const flow = {
      elements: [
        { id: 'pythonrpc', module: 'python', functionFqn: 'python.tasks.python-rpc', properties: { a: 4, b: 7 } },
        { id: 'pythonshell', module: 'python', functionFqn: 'python.tasks.python-shell', properties: { a: 4, b: 7 } },
      ],
      connections: [
        { id: 'testConnection1', source: 'testTriggerRpc', target: 'pythonrpc' },
        { id: 'testConnection2', source: 'testTriggerShell', target: 'pythonshell' },
      ],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    const amqpConnection = new AmqpConnection({ uri: 'amqp://localhost' });
    await amqpConnection.init();
    flowApp = new FlowApplication([PythonModule], flow, null, amqpConnection, true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  test('rpc', async (done) => {
    flowApp.subscribe('pythonrpc.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ factorial: 24, mul: 280, sum: 21, x: 10 });
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTriggerRpc' }, { x: 10 }));
  });

  test('shell', async (done) => {
    flowApp.subscribe('pythonshell.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ factorial: 24, mul: 280, sum: 21, x: 10 });
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTriggerShell' }, { x: 10 }));
  });

  afterAll(async () => {
    await flowApp.destroy();
  });
});
