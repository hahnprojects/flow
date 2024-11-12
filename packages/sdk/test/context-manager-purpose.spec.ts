import { FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, FlowTask, FlowTrigger, InputStream } from '../lib';
import { IsArray, IsBoolean, IsIn, IsString, ValidateNested, IsOptional, IsNotEmpty } from 'class-validator';
import { loggerMock } from './logger.mock';
import { Type } from 'class-transformer';
import { CloudEvent } from 'cloudevents';

class Properties {}

@FlowFunction('test.default.trigger')
class TestTrigger extends FlowResource {
  constructor(context, properties: unknown) {
    super(context, properties, Properties);
  }

  @InputStream()
  public async onDefault(event) {
    return this.emitEvent({ empty: 'empty' }, event);
  }
}

type ValueDataType = 'string' | 'number' | 'boolean';

@FlowFunction('test.default.Inject')
export class TestInject extends FlowTask<InjectionProperties> {
  constructor(context, properties: unknown) {
    super(context, properties, InjectionProperties, true);
  }

  @InputStream()
  public async inject(event: FlowEvent) {
    const injectedData = event.getData();
    for (const injection of this.properties.injections || []) {
      injectedData[injection.key] = this.resolveValue(injection.value, injection.valueDatatype);
    }
    return this.emitEvent(injectedData, event);
  }

  private resolveValue(value: string, valueDatatype: ValueDataType) {
    let resultValue;
    switch (valueDatatype) {
      case 'boolean':
        resultValue = value === 'true';
        break;
      case 'number':
        resultValue = parseFloat(value);
        break;
      default:
        resultValue = value;
        break;
    }
    return resultValue;
  }
}

class Injection {
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsIn(['string', 'number', 'boolean'])
  @IsNotEmpty()
  @IsString()
  valueDatatype?: 'string' | 'number' | 'boolean';
}

class InjectionProperties {
  @IsArray()
  @Type(() => Injection)
  @ValidateNested({ each: true })
  injections: Injection[];
}

@FlowFunction('test.default.Noop')
export class TestNoop extends FlowTask<TestProperties> {
  constructor(context, properties: unknown) {
    super(context, properties, TestProperties, true);
  }

  @InputStream()
  public async noop(event: FlowEvent) {
    const data = event.getData();
    if (this.properties.logData === true) {
      this.logger.log(data, { truncate: false });
    }
    return this.emitEvent(data, event);
  }
}

class TestProperties {
  @IsBoolean()
  @IsOptional()
  logData?: boolean;
}

@FlowModule({
  name: 'test-module',
  declarations: [TestTrigger, TestInject, TestNoop],
})
class TestModule {}

describe('CMTP.1: ContextManager purpose test', () => {
  const flow = {
    elements: [
      { id: 'testTrigger', module: 'test-module', functionFqn: 'test.default.trigger', properties: {} },
      {
        id: 'testInject',
        module: 'test-module',
        functionFqn: 'test.default.Inject',
        properties: {
          injections: [
            {
              key: 'value',
              value: '${flow.value}',
              valueDatatype: 'number',
            },
            {
              key: 'test',
              value: '${test}',
              valueDatatype: 'string',
            },
          ],
        },
      },
      { id: 'testNoop', module: 'test-module', functionFqn: 'test.default.Noop', properties: { logData: true } },
    ],
    connections: [
      { id: 'testConnection1', source: 'testTrigger', target: 'testInject' },
      { id: 'testConnection2', source: 'testInject', target: 'testNoop' },
    ],
    context: {
      flowId: 'testFlow',
      deploymentId: 'testDeployment',
    },
    properties: { value: '123' },
  };

  let flowApp: FlowApplication;
  beforeEach(() => {
    flowApp = new FlowApplication([TestModule], flow, { logger: loggerMock, skipApi: true });
  });

  afterEach(async () => {
    await flowApp.destroy();
  });

  test('CMTP.1.1: Should overwrite all placeholder properties starting with flow. at init', async () => {
    await flowApp.init();
    expect(Array.isArray(((flowApp as any).elements['testInject'] as any).properties.injections)).toBe(true);
    expect(((flowApp as any).elements['testInject'] as any).getPropertiesWithPlaceholders().injections[0].value).toBe('${flow.value}');
    expect(((flowApp as any).elements['testInject'] as any).properties.injections[0].value).toBe('123');
    expect(((flowApp as any).elements['testInject'] as any).getPropertiesWithPlaceholders().injections[1].value).toBe('${test}');
    expect(((flowApp as any).elements['testInject'] as any).properties.injections[1].value).toBe('${test}');
  });

  test('CMTP.1.2: Should overwrite all placeholder properties starting with flow. also at update', (done) => {
    let iteration = 0;
    flowApp.subscribe('testNoop.default', {
      next: (flowEvent: FlowEvent) => {
        expect(((flowApp as any).elements['testInject'] as any).getPropertiesWithPlaceholders().injections[0].value).toBe('${flow.value}');
        expect(((flowApp as any).elements['testInject'] as any).getPropertiesWithPlaceholders().injections[1].value).toBe('${test}');

        const data = flowEvent.getData();
        console.log(data);
        expect(data.test).toEqual('${test}');

        iteration++;
        if (iteration === 1) {
          expect(data.value).toEqual(123);
        } else if (iteration === 2) {
          expect(data.value).toEqual(456);
        } else if (iteration === 3) {
          expect(data.value).toEqual(1);
          done();
        }
      },
    });

    // Check the initial values in first iteration
    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));

    const cloudEvent = new CloudEvent({
      source: 'flowstudio/deployments',
      type: 'com.flowstudio.deployment.update',
    });

    flowApp
      .onMessage({ content: JSON.stringify({ ...cloudEvent, data: { properties: { value: 456 } } }) } as any)
      .then(() => {
        // Check the updated values in second iteration
        return flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
      })
      .then(() => {
        return flowApp.onMessage({
          content: JSON.stringify({ ...cloudEvent, data: { properties: { value: 1 } } }),
        } as any);
      })
      .then(() => {
        // Check the updated values in fourth iteration
        return flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
      });
  }, 60000);

  test('CMTP.1.3: Should overwrite all placeholder properties starting with flow. also at update even when the element properties update', (done) => {
    let iteration = 0;
    flowApp.subscribe('testNoop.default', {
      next: (flowEvent: FlowEvent) => {
        const data = flowEvent.getData();
        iteration++;
        if (iteration === 1) {
          expect((flowApp as any).elements['testInject'].getPropertiesWithPlaceholders().injections.length).toBe(2);
          expect((flowApp as any).elements['testInject'].getPropertiesWithPlaceholders().injections[0].value).toBe('${flow.value}');
          expect(data.value).toEqual(123);
        } else if (iteration === 2) {
          expect((flowApp as any).elements['testInject'].getPropertiesWithPlaceholders().injections.length).toBe(1);
          expect((flowApp as any).elements['testInject'].getPropertiesWithPlaceholders().injections[0].value).toBe('987');
          expect(data.value).toEqual(987);
          done();
        }
      },
    });

    // Check the initial values in first iteration
    flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));

    const cloudEvent = new CloudEvent({
      source: 'flowstudio/deployments',
      type: 'com.flowstudio.deployment.update',
    });

    flowApp
      .onMessage({
        content: JSON.stringify({
          ...cloudEvent,
          data: {
            properties: { value: 456 },
            elements: [
              {
                id: 'testInject',
                properties: {
                  injections: [{ key: 'value', value: '987', valueDatatype: 'number' }],
                },
              },
            ],
          },
        }),
      } as any)
      .then(() => {
        // Check the updated values in second iteration
        return flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
      });
  }, 60000);
});
