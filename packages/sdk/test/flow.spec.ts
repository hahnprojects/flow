import { MockAPI } from '@hahnpro/hpc-api';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { setTimeout } from 'timers/promises';

import { delay, FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, FlowTask, InputStream } from '../lib';
import { loggerMock } from './mocks/logger.mock';
import { NatsConnectionMock } from './mocks/nats-connection.mock';

describe('Flow Application', () => {
  let nc: NatsConnectionMock;
  let flowApplication: FlowApplication;

  beforeEach(async () => {
    nc = new NatsConnectionMock();
  });

  afterEach(async () => {
    await flowApplication?.destroy();
    await nc?.close();

    loggerMock.log.mockReset();
    loggerMock.warn.mockReset();
    loggerMock.error.mockReset();

    console.log('jest ende');
  });

  it('FLOW.FA.1 should run simple flow app with a long running task', async () => {
    const size = 8;
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'testResource', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        {
          id: 'longRunningTask',
          module: 'test-module',
          functionFqn: 'test.task.LongRunningTask',
          properties: { delay: 500 },
        },
      ],
      connections: [
        { id: 'testConnection1', source: 'testTrigger', target: 'testResource' },
        { id: 'testConnection2', source: 'testResource', target: 'longRunningTask' },
      ],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    flowApplication = new FlowApplication([TestModule], flow, {
      natsConnection: nc as any,
      logger: loggerMock,
      skipApi: true,
      explicitInit: true,
    });
    await flowApplication.init();

    flowApplication.subscribe('testResource.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ hello: 'world' });
      },
    });

    const done = new Promise<void>((resolve, reject) => {
      let count = 0;
      flowApplication.subscribe('longRunningTask.default', {
        next: (event: FlowEvent) => {
          try {
            expect(event.getData()).toEqual({ foo: 'bar' });
            expect(event.getDataContentType()).toBe('application/json');
            expect(event.getSource()).toBe('flows/testFlow/deployments/testDeployment/elements/longRunningTask');
            expect(event.getSubject()).toBe('test.task.LongRunningTask');
            expect(event.getType()).toBe('default');
            expect(event.getTime()).toBeDefined();

            if (++count === size) {
              resolve();
            }
          } catch (e) {
            reject(e);
          }
        },
      });
    });

    for (let i = 0; i < size; i++) {
      flowApplication.emit(new FlowEvent({ id: 'testTrigger' }, {}));
    }

    expect(loggerMock.log).toHaveBeenCalledWith('Flow Deployment is running', expect.objectContaining(flow.context));
    return done;
  }, 10000);

  it('FLOW.FA.2 should handle invalid stream handlers', async () => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'testResource', module: 'test-module', functionFqn: 'test.resource.TestResource' },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource', targetStream: 'does-not-exist' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    flowApplication = new FlowApplication([TestModule], flow, { logger: loggerMock, skipApi: true, explicitInit: true });
    await flowApplication.init();

    expect(loggerMock.error).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('testResource does not implement a handler for does-not-exist\nat logErrorAndExit'),
      {
        ...flow.context,
        functionFqn: 'FlowApplication',
        id: 'none',
      },
    );
  });

  it('FLOW.FA.3 should handle invalid function FQNs', async () => {
    const flow = {
      elements: [{ id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.Test123' }],
      connections: [],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    flowApplication = new FlowApplication([TestModule], flow, { logger: loggerMock, skipApi: true, explicitInit: true });
    await flowApplication.init();

    expect(loggerMock.warn).toHaveBeenCalledTimes(0);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining('Could not create FlowElement for test-module.test.resource.Test123\nat logErrorAndExit'),
      expect.objectContaining(flow.context),
    );
  });

  it('FLOW.FA.4 should handle invalid connection targets', async () => {
    const flow = {
      elements: [{ id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' }],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    flowApplication = new FlowApplication([TestModule], flow, { logger: loggerMock, skipApi: true, explicitInit: true });
    await flowApplication.init();

    expect(loggerMock.warn).toHaveBeenCalledTimes(0);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining('testResource has not been initialized\nat logErrorAndExit'),
      {
        ...flow.context,
        functionFqn: 'FlowApplication',
        id: 'none',
      },
    );
  });

  it('FLOW.FA.5 should handle invalid flow modules', async () => {
    const flow = {
      elements: [{ id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' }],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    flowApplication = new FlowApplication([FakeModule], flow, { logger: loggerMock, skipApi: true, explicitInit: true });
    await flowApplication.init();

    expect(loggerMock.warn).toHaveBeenCalledTimes(0);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining('FlowModule (FakeModule) metadata is missing or invalid\nat logErrorAndExit'),
      {
        ...flow.context,
        functionFqn: 'FlowApplication',
        id: 'none',
      },
    );
  });

  it('FLOW.FA.6 should handle invalid flow functions', async () => {
    const flow = {
      elements: [{ id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' }],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    flowApplication = new FlowApplication([TestModule2], flow, { logger: loggerMock, skipApi: true, explicitInit: true });
    await flowApplication.init();

    expect(loggerMock.warn).toHaveBeenCalledTimes(0);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      expect.stringContaining('FlowFunction (FakeTask) metadata is missing or invalid\nat logErrorAndExit'),
      {
        ...flow.context,
        functionFqn: 'FlowApplication',
        id: 'none',
      },
    );
  });

  it('FLOW.FA.7 should warn if high event loop utilization is detected', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'highEluTask', module: 'test-module', functionFqn: 'test.task.HighEluTask', properties: { n: 1_000_000_000 } },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'highEluTask' }],
      context: { flowId: 'testFlow', deploymentId: 'testDeployment' },
    };
    flowApplication = new FlowApplication([TestModule], flow, loggerMock, null, null, true);

    flowApplication.subscribe('highEluTask.default', {
      next: async (event: FlowEvent) => {
        expect(event.getData()).toEqual({ foo: 'bar' });
        await setTimeout(200);
        try {
          expect(loggerMock.warn).toHaveBeenCalledTimes(1);
          expect(loggerMock.warn).toHaveBeenCalledWith(
            expect.stringContaining('High event loop utilization detected for highEluTask.default with event'),
            { ...flow.context, functionFqn: 'FlowApplication', id: 'none' },
          );
          done();
        } catch (err) {
          done(err);
        }
      },
    });

    flowApplication.emit(new FlowEvent({ id: 'testTrigger' }, {}));
    expect(loggerMock.log).toHaveBeenCalledWith('Flow Deployment is running', expect.objectContaining(flow.context));
  }, 20000);
/*
  it('FLOW.FA.8 should warn if event queue size is above threshold', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'longRunningTask', module: 'test-module', functionFqn: 'test.task.LongRunningTask', properties: { delay: 300 } },
      ],
      connections: [{ id: 'testConnection', source: 'testTrigger', target: 'longRunningTask' }],
      context: { flowId: 'testFlow', deploymentId: 'testDeployment' },
    };
    flowApplication = new FlowApplication([TestModule], flow, { logger: loggerMock, skipApi: true });

    let count = 0;
    flowApplication.subscribe('longRunningTask.default', {
      next: (event: FlowEvent) => {
        try {
          expect(event.getData()).toEqual({ foo: 'bar' });
          if (++count === 10) {
            expect(loggerMock.warn).toHaveBeenCalledTimes(2);
            expect(loggerMock.warn).toHaveBeenCalledWith(
              expect.stringContaining('Input stream "longRunningTask.default" has 100 queued events\nat FlowApplication.setQueueMetrics'),
              {
                deploymentId: 'testDeployment',
                flowId: 'testFlow',
                functionFqn: 'FlowApplication',
                id: 'none',
              },
            );
            expect(loggerMock.warn).toHaveBeenLastCalledWith(
              expect.stringContaining('Input stream "longRunningTask.default" has 200 queued events\nat FlowApplication.setQueueMetrics'),
              expect.anything(),
            );
            flowApplication.destroy();
            done();
            console.log("code ende");
          }
        } catch (err) {
          flowApplication.destroy();
          done(err);
          console.log("code ende");
        }
      },
    });

    for (let i = 0; i < 210; i++) {
      flowApplication.emit(new FlowEvent({ id: 'testTrigger' }, {}));
    }

    expect(loggerMock.log).toHaveBeenCalledWith('Flow Deployment is running', expect.objectContaining(flow.context));
  }, 10000);
*/
  it('FLOW.FA.9 test complex properties', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        {
          id: 'complex',
          module: 'test-module',
          functionFqn: 'test.resource.ComplexProperties',
          properties: {
            variables: [
              {
                name: 'testVar1',
                function: 'rndSin',
                min: 0,
                max: 20,
              },
              {
                name: 'testVar2',
                function: 'rndCos',
                min: 10,
                max: 100,
              },
              {
                name: 'testVar3',
                function: 'rndInt',
                min: 20,
                max: 20,
              },
            ],
          },
        },
      ],
      connections: [{ id: 'testConnection', source: 'testTrigger', target: 'complex' }],
      context: { flowId: 'testFlow', deploymentId: 'testDeployment' },
    };
    flowApplication = new FlowApplication([TestModule], flow, { logger: loggerMock, skipApi: true });

    flowApplication.subscribe('complex.default', {
      next: (event: FlowEvent) => {
        const data = event.getData();
        expect(data.variables.every((v) => v instanceof Options)).toBe(true);
        done();
      },
    });
    flowApplication.emit(new FlowEvent({ id: 'testTrigger' }, {}));
  });

  it('FLOW.FA.10 should take a Mock-API as a parameter', () => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' },
        { id: 'testTask', module: 'test-module', functionFqn: 'test.task.TestTask' },
      ],
      connections: [{ id: 'testConnection', source: 'testTrigger', target: 'testTask' }],
      context: { flowId: 'testFlow', deploymentId: 'testDeployment' },
    };
    flowApplication = new FlowApplication([TestModule], flow, { logger: loggerMock, skipApi: true, mockApi: new MockAPI({}) });

    expect(flowApplication.api).toBeInstanceOf(MockAPI);
  });

  it('FLOW.FA.11 should take the standard order of parameters', async () => {
    const flow = {
      elements: [{ id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' }],
      connections: [],
      context: { flowId: 'testFlow', deploymentId: 'testDeployment' },
    };

    const flowApp1 = new FlowApplication([TestModule], flow, { logger: loggerMock, skipApi: true });
    expect(flowApp1.api).toBeNull();
    expect(flowApp1.natsConnection).toBeUndefined();
    await flowApp1.destroy(0);

    const flowApp2 = new FlowApplication([TestModule], flow, {
      skipApi: true,
      amqpConfig: {},
      natsConnection: nc as any,
      explicitInit: true,
      logger: loggerMock,
    });
    expect(flowApp2.natsConnection).toBeDefined();
    await flowApp2.destroy(0);
  }, 60000);

  it('FLOW.FA.12 should take positional parameters', async () => {
    const flow = {
      elements: [{ id: 'testTrigger', module: 'test-module', functionFqn: 'test.resource.TestResource' }],
      connections: [],
      context: { flowId: 'testFlow', deploymentId: 'testDeployment' },
    };

    const flowApp1 = new FlowApplication([TestModule], flow, loggerMock, null, null, true, true);
    expect(flowApp1.api).toBeNull();
    expect(flowApp1.natsConnection).toBeNull();
    await flowApp1.destroy(0);

    const flowApp2 = new FlowApplication([TestModule], flow, loggerMock, null, nc as any, true, true);
    expect(flowApp2.natsConnection).toBeDefined();
    await flowApp2.destroy(0);
  }, 60000);
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  @InputStream('default', { concurrent: 5 })
  public async onDefault(event) {
    return this.emitEvent({ hello: 'world' }, null);
  }
}

class Options {
  @IsString()
  name: string;

  @IsString()
  function: string;

  @IsNumber()
  min: number;

  @IsNumber()
  max: number;
}

class ComplexProperties {
  @IsArray()
  @Type(() => Options)
  @ValidateNested({ each: true })
  variables: Options[];
}

@FlowFunction('test.resource.ComplexProperties')
class TestComplexProperties extends FlowResource {
  constructor(context, properties) {
    super(context, properties, ComplexProperties, true);
  }

  @InputStream()
  public async onDefault(event) {
    return this.emitEvent(this.properties, event);
  }
}

@FlowFunction('test.task.LongRunningTask')
class LongRunningTask extends FlowTask<Properties> {
  constructor(context, properties) {
    super(context, properties, Properties);
  }

  @InputStream()
  public async loveMeLongTime(event) {
    await delay(this.properties.delay);
    return this.emitEvent({ foo: 'bar' }, null);
  }
}

class Properties {
  @IsNumber()
  delay: number;
}

@FlowFunction('test.task.HighEluTask')
class HighEluTask extends FlowTask<HighEluProperties> {
  constructor(context, properties) {
    super(context, properties, HighEluProperties);
  }

  @InputStream()
  public async onDefault(event) {
    for (let i = 0; i < this.properties.n; i++) {
      if (i % (this.properties.n / 10) === 0) {
        await setTimeout(10);
      }
    }
    return this.emitEvent({ foo: 'bar' }, null);
  }
}

class HighEluProperties {
  @IsNumber()
  n: number;
}

@FlowModule({
  name: 'test-module',
  declarations: [HighEluTask, LongRunningTask, TestResource, TestComplexProperties],
})
class TestModule {}

class FakeTask {}

@FlowModule({
  name: 'test-module2',
  declarations: [FakeTask as any],
})
class TestModule2 {}

class FakeModule {}
