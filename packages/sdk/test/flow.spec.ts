import { IsNumber } from 'class-validator';

import { delay, FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, FlowTask, InputStream } from '../lib';
import { loggerMock } from './logger.mock';

describe('Flow Application', () => {
  let mockExit;

  beforeEach(() => {
    mockExit = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    mockExit.mockClear();
    loggerMock.log.mockReset();
    loggerMock.warn.mockReset();
    loggerMock.error.mockReset();
    jest.restoreAllMocks();
  });

  it('FLOW.FA.1 should run simple flow app with a long running task', (done) => {
    const size = 8;
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource' },
        { id: 'testResource', module: 'test.module', functionFqn: 'test.resource.TestResource' },
        { id: 'longRunningTask', module: 'test.module', functionFqn: 'test.task.LongRunningTask', properties: { delay: 500 } },
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
    const flowApp = new FlowApplication([TestModule], flow, loggerMock, null, true);

    flowApp.subscribe('testResource.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ hello: 'world' });
      },
    });

    let count = 0;
    flowApp.subscribe('longRunningTask.default', {
      next: (event: FlowEvent) => {
        expect(event.getData()).toEqual({ foo: 'bar' });
        expect(event.getDataContentType()).toBe('application/json');
        expect(event.getSource()).toBe('flows/testFlow/deployments/testDeployment/elements/longRunningTask');
        expect(event.getSubject()).toBe('test.task.LongRunningTask');
        expect(event.getType()).toBe('default');
        expect(event.getTime()).toBeDefined();

        if (++count === size) {
          expect(mockExit).not.toHaveBeenCalled();
          done();
        }
      },
    });

    for (let i = 0; i < size; i++) {
      flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
    }

    expect(loggerMock.log).toHaveBeenCalledWith('Flow Deployment is running', expect.objectContaining(flow.context));
  });

  it('FLOW.FA.2 should handle invalid stream handlers', async () => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource' },
        { id: 'testResource', module: 'test.module', functionFqn: 'test.resource.TestResource' },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource', targetStream: 'does-not-exist' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    new FlowApplication([TestModule], flow, loggerMock, null, true);
    await new Promise((res) => setTimeout(res, 300));

    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenLastCalledWith(new Error('testResource does not implement a handler for does-not-exist'), {
      ...flow.context,
      functionFqn: 'FlowApplication',
      id: 'none',
    });

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('FLOW.FA.3 should handle invalid function FQNs', async () => {
    const flow = {
      elements: [{ id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.Test123' }],
      connections: [],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    new FlowApplication([TestModule], flow, loggerMock, null, true);
    await new Promise((res) => setTimeout(res, 300));

    expect(loggerMock.warn).toHaveBeenCalledTimes(0);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenLastCalledWith(
      new Error('Could not create FlowElement for test.module.test.resource.Test123'),
      expect.objectContaining(flow.context),
    );

    expect(mockExit).toHaveBeenCalledWith(1);
  });
  it('FLOW.FA.4 should handle invalid connection targets', async () => {
    const flow = {
      elements: [{ id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource' }],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    new FlowApplication([TestModule], flow, loggerMock, null, true);
    await new Promise((res) => setTimeout(res, 300));

    expect(loggerMock.warn).toHaveBeenCalledTimes(0);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenLastCalledWith(new Error('testResource has not been initialized'), {
      ...flow.context,
      functionFqn: 'FlowApplication',
      id: 'none',
    });

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('FLOW.FA.5 should handle invalid flow modules', async () => {
    const flow = {
      elements: [{ id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource' }],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    new FlowApplication([FakeModule], flow, loggerMock, null, true);
    await new Promise((res) => setTimeout(res, 300));

    expect(loggerMock.warn).toHaveBeenCalledTimes(0);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenLastCalledWith(new Error('FlowModule (FakeModule) metadata is missing or invalid'), {
      ...flow.context,
      functionFqn: 'FlowApplication',
      id: 'none',
    });

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('FLOW.FA.6 should handle invalid flow functions', async () => {
    const flow = {
      elements: [{ id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource' }],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'testResource' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    new FlowApplication([TestModule2], flow, loggerMock, null, true);
    await new Promise((res) => setTimeout(res, 300));

    expect(loggerMock.warn).toHaveBeenCalledTimes(0);
    expect(loggerMock.error).toHaveBeenCalledTimes(1);
    expect(loggerMock.error).toHaveBeenLastCalledWith(new Error('FlowFunction (FakeTask) metadata is missing or invalid'), {
      ...flow.context,
      functionFqn: 'FlowApplication',
      id: 'none',
    });

    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('FLOW.FA.7 should warn if high event loop utilization is detected', (done) => {
    const flow = {
      elements: [
        { id: 'testTrigger', module: 'test.module', functionFqn: 'test.resource.TestResource' },
        { id: 'highEluTask', module: 'test.module', functionFqn: 'test.task.HighEluTask', properties: { n: 500_000_000 } },
      ],
      connections: [{ id: 'testConnection1', source: 'testTrigger', target: 'highEluTask' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    const flowApp = new FlowApplication([TestModule], flow, loggerMock, null, true);

    flowApp.subscribe('highEluTask.default', {
      next: async (event: FlowEvent) => {
        expect(event.getData()).toEqual({ foo: 'bar' });
        await new Promise((res) => setTimeout(res, 100));
        expect(loggerMock.warn).toHaveBeenCalledTimes(1);
        expect(loggerMock.warn).toHaveBeenCalledWith(
          expect.stringContaining('High event loop utilization detected for highEluTask.default with event'),
          { ...flow.context, functionFqn: 'FlowApplication', id: 'none' },
        );
        expect(mockExit).not.toHaveBeenCalled();
        done();
      },
    });

    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
    expect(loggerMock.log).toHaveBeenCalledWith('Flow Deployment is running', expect.objectContaining(flow.context));
  }, 60000);
});

@FlowFunction('test.resource.TestResource')
class TestResource extends FlowResource {
  @InputStream('default', { concurrent: 5 })
  public async onDefault(event) {
    return this.emitEvent({ hello: 'world' }, null);
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
        await new Promise((res) => setTimeout(res, 10));
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
  name: 'test.module',
  declarations: [HighEluTask, LongRunningTask, TestResource],
})
class TestModule {}

class FakeTask {}

@FlowModule({
  name: 'test.module2',
  declarations: [FakeTask as any],
})
class TestModule2 {}

class FakeModule {}
