import { FlowFunction, FlowTask, InputStream } from './FlowElement';
import { FlowEvent } from './FlowEvent';
import { FlowModule } from './FlowModule';

@FlowFunction('test.task.Trigger')
class TestTrigger extends FlowTask {
  @InputStream('default')
  public async onDefault(event: FlowEvent) {
    return this.emitEvent(event.getData(), event);
  }
}

@FlowModule({ name: 'test', declarations: [TestTrigger] })
export class TestModule {}
