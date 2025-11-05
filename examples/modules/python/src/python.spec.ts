import { FlowApplication, FlowEvent, TestModule } from '@hahnpro/flow-sdk';
import { setTimeout } from 'timers/promises';

import PythonModule from '../';

describe('Python', () => {
  let flowApp: FlowApplication;

  beforeAll(async () => {
    const flow = {
      elements: [
        { id: 'testTriggerShell', module: 'test', functionFqn: 'test.task.Trigger' },
        { id: 'pythonshell', module: 'python', functionFqn: 'python.tasks.python-shell', properties: { a: 4, b: 7 } },
      ],
      connections: [{ id: 'testConnection2', source: 'testTriggerShell', target: 'pythonshell' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    flowApp = new FlowApplication([PythonModule, TestModule], flow, { skipApi: true });
    await setTimeout(2000);
  });

  test('shell', (done) => {
    flowApp.subscribe('pythonshell.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ factorial: 24, mul: 280, sum: 21, x: 10 });
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTriggerShell' }, { x: 10 }));
  });
});
