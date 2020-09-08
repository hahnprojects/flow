import { FlowFunction, InputStream } from './FlowElement';
import { FlowEvent } from './FlowEvent';
import { FlowModule } from './FlowModule';
import { FlowTask } from './FlowTask';

@FlowFunction('test.task.Trigger')
class TestTrigger extends FlowTask {
  @InputStream('default')
  public async onDefault(event: FlowEvent) {
    return this.emitOutput(event.getData());
  }
}

@FlowModule({ name: 'test', declarations: [TestTrigger] })
export class TestModule {}
