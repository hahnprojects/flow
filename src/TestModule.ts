import { FlowFunction, InputStream } from './FlowElement';
import { FlowModule } from './FlowModule';
import { FlowTask } from './FlowTask';

@FlowFunction('test.task.Trigger')
class TestTrigger extends FlowTask {
  @InputStream('default')
  public async onDefault(event) {
    return this.emitEvent(event);
  }
}

@FlowModule({ name: 'test', declarations: [TestTrigger] })
export class TestModule {}
