import { Flow, FlowApplication, FlowEvent, TestModule } from '@hahnpro/flow-sdk';

import ExampleModule from '../';

/* eslint-disable no-console */
describe('Example Test', () => {
  test('flow', (done) => {
    const flow: Flow = {
      elements: [
        { id: 'trigger', module: 'test', functionFqn: 'test.task.Trigger' },
        {
          id: 'nothing',
          module: 'example',
          functionFqn: 'example.tasks.DoNothing',
          properties: { logData: false },
        },
        {
          id: 'something1',
          module: 'example',
          functionFqn: 'example.resources.DoSomething',
          properties: { min: 10, max: 100 },
        },
        {
          id: 'something2',
          module: 'example',
          functionFqn: 'example.resources.DoSomething',
          properties: { min: 200, max: 400 },
        },
        {
          id: 'modify',
          module: 'example',
          functionFqn: 'example.tasks.ModifySomething',
        },
      ],
      connections: [
        { id: 'c0', source: 'trigger', target: 'something1' },
        { id: 'c1', source: 'trigger', target: 'something2' },
        { id: 'c2', source: 'something1', target: 'modify' },
      ],
    };
    const flowApp = new FlowApplication([ExampleModule, TestModule], flow, null, null, true);

    flowApp.subscribe('something1.default', {
      next: (event: FlowEvent) => {
        const data = event.getData();
        expect(data).toBeDefined();
        expect(data.num).toBeGreaterThanOrEqual(10);
        expect(data.num).toBeLessThanOrEqual(100);
      },
    });

    flowApp.subscribe('something2.default', {
      next: (event: FlowEvent) => {
        const data = event.getData();
        expect(data).toBeDefined();
        expect(data.num).toBeGreaterThanOrEqual(200);
        expect(data.num).toBeLessThanOrEqual(400);
      },
    });

    flowApp.subscribe('modify.default', {
      next: (event: FlowEvent) => {
        const data = event.getData();
        expect(data).toBeDefined();
        expect(data.num).toBeGreaterThanOrEqual(420);
        expect(data.num).toBeLessThanOrEqual(4200);

        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'trigger' }, {}));
  }, 60000);
});
