import { defaultLogger, FlowApplication, FlowEvent, FlowFunction, FlowModule, FlowResource, FlowTask, InputStream } from '../lib';
import { IsArray, IsBoolean, IsDefined, IsMongoId, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CloudEvent } from 'cloudevents';

class Properties {
  @IsMongoId()
  assetId: string;

  @IsNumber()
  num: number;

  @IsBoolean()
  bool: boolean;

  @IsString()
  str: string;
}

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

@FlowFunction('test.default.Inject')
export class TestInject extends FlowTask<InjectionProperties> {
  constructor(context, properties: unknown) {
    super(context, properties, InjectionProperties, true);
  }

  @InputStream()
  public async inject(event: FlowEvent) {
    const injectedData = event.getData();
    for (const injection of this.properties.injections || []) {
      injectedData[injection.key] = injection.value;
    }
    return this.emitEvent(injectedData, event);
  }
}

class Injection {
  @IsString()
  key: string;

  @IsDefined()
  value: string | number | boolean;
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

const extraProps = { assetId: '6710bd72faed82719294743f', otherString: 'foo', num: -42.5, bool: false };

describe('CMTP.1: ContextManager purpose test', () => {
  const flow = {
    elements: [
      {
        id: 'testTrigger',
        module: 'test-module',
        functionFqn: 'test.default.trigger',
        properties: {
          assetId: '${flow.assetId}',
          num: '${flow.num}',
          bool: '${flow.bool}',
          str: '${flow.assetId}, ${flow.otherString}, ${flow.doesNotExist}',
        },
      },
      {
        id: 'testInject',
        module: 'test-module',
        functionFqn: 'test.default.Inject',
        properties: {
          injections: [
            {
              key: 'value',
              value: '${flow.value}',
            },
            {
              key: 'test',
              value: '${test}',
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
    properties: { flow: { value: '123', ...extraProps }, test: 'rolf' },
  };

  let flowApp: FlowApplication;
  beforeEach(() => {
    flowApp = new FlowApplication([TestModule], flow, { logger: defaultLogger, skipApi: true });
  });

  afterEach(async () => {
    await flowApp.destroy();
  });

  test('CMTP.1.1: Should overwrite all placeholder properties starting with flow. at init', async () => {
    expect(Array.isArray(((flowApp as any).elements['testInject'] as any).properties.injections)).toBe(true);
    expect(((flowApp as any).elements['testInject'] as any).getPropertiesWithPlaceholders().injections[0].value).toBe('${flow.value}');
    expect(((flowApp as any).elements['testInject'] as any).properties.injections[0].value).toBe(123);
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
        expect(data.test).toEqual('${test}');

        iteration++;
        if (iteration === 1) {
          expect(data.value).toEqual(123);
        } else if (iteration === 2) {
          expect(data.value).toEqual(456);
        } else if (iteration === 3) {
          expect(data.value).toEqual(456);
        } else if (iteration === 4) {
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
      .onMessage({ content: JSON.stringify({ ...cloudEvent, data: { properties: { flow: { value: 456, ...extraProps } } } }) } as any)
      .then(() => {
        // Check the updated values in second iteration
        return flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
      })
      .then(() => {
        return flowApp.onMessage({ content: JSON.stringify({ ...cloudEvent, data: { properties: { test: 'tom' } } }) } as any);
      })
      .then(() => {
        // Check the updated values in third iteration
        return flowApp.emit(new FlowEvent({ id: 'testTrigger' }, {}));
      })
      .then(() => {
        return flowApp.onMessage({
          content: JSON.stringify({ ...cloudEvent, data: { properties: { flow: { value: 1, ...extraProps }, test: 'anna' } } }),
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
          expect((flowApp as any).elements['testInject'].getPropertiesWithPlaceholders().injections[0].value).toBe(987);
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
            properties: { flow: { value: 456, ...extraProps } },
            elements: [
              {
                id: 'testInject',
                properties: {
                  injections: [{ key: 'value', value: 987, valueDatatype: 'number' }],
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
  }, 10000);
});
