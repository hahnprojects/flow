import { delay, FlowEvent, FlowFunction, FlowTask, InputStream } from '@hahnpro/flow-sdk';
import { IsNumber } from 'class-validator';

@FlowFunction('example.tasks.ModifySomething')
export class ModifySomething extends FlowTask {
  @InputStream()
  public async generateRandomNumber(event: FlowEvent) {
    const data = this.validateEventData(InputProperties, event);

    // simulate long running computation
    await delay(1000);
    data.num *= 42;

    return this.emitOutput(data);
  }
}

class InputProperties {
  @IsNumber()
  num: number;
}
