import { IsOptional, IsString } from 'class-validator';
import {
  defaultAMQPConnectionOptions,
  FlowApplication,
  FlowEvent,
  FlowFunction,
  FlowModule,
  FlowTask,
  InputStream,
  TestModule,
} from '../lib';
import cloneDeep = require('lodash/cloneDeep');
import get = require('lodash/get');
import set = require('lodash/set');
import unset = require('lodash/unset');

describe('foreach bug', () => {
  let flowApp: FlowApplication;

  beforeAll(async () => {
    const flow = {
      elements: [
        { id: 'trigger', module: 'test', functionFqn: 'test.task.Trigger' },
        { id: 'foreach', module: 'defaultCopy', functionFqn: 'default.tasks.ForEach', properties: { propertyPath: 'test' } },
      ],
      connections: [{ id: 'testConnection1', source: 'trigger', target: 'foreach' }],
      context: {
        flowId: 'testFlow',
        deploymentId: 'testDeployment',
      },
    };
    flowApp = new FlowApplication([DefaultModule, TestModule], flow, { amqpConnectionOptions: defaultAMQPConnectionOptions });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  test('FM.DEF.FEBUG.1 bug', (done) => {
    flowApp.subscribe('foreach.default', {
      next: (event: FlowEvent) => {
        if (event.getData().test === 4999) {
          done();
        }
      },
    });

    flowApp.emit(new FlowEvent({ id: 'trigger' }, { test: Array.from({ length: 5000 }, (v, i) => i) }));
  }, 60000);

  afterAll(async () => {
    await flowApp.destroy();
  });
});

@FlowFunction('default.tasks.ForEach')
export class ForEach extends FlowTask<Properties> {
  constructor(context, properties: unknown) {
    super(context, properties, Properties, true);
  }

  @InputStream()
  public async process(event: FlowEvent) {
    const { propertyPath, newPropertyPath } = this.properties;
    const data = event.getData();

    let value = get(data, [propertyPath]);
    let resolved = false;
    if (value == null) {
      value = get(data, propertyPath);
      resolved = true;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        const newData = cloneDeep(data);
        unset(newData, resolved ? propertyPath : [propertyPath]);
        const path = newPropertyPath || (resolved ? propertyPath : [propertyPath]);
        set(newData, path, item);
        this.emitEvent(newData, event);
      });
    } else {
      this.logger.error('Property is not an array');
    }
  }
}

class Properties {
  @IsString()
  propertyPath: string;

  @IsOptional()
  @IsString()
  newPropertyPath?: string;
}

@FlowModule({
  name: 'defaultCopy',
  declarations: [ForEach],
})
export default class DefaultModule {}
