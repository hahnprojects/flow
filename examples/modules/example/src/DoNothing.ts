import { FlowEvent, FlowFunction, FlowTask, InputStream } from '@hahnpro/flow-sdk';
import { IsBoolean, IsOptional } from 'class-validator';

@FlowFunction('example.tasks.DoNothing')
export class DoNothing extends FlowTask<Properties> {
  constructor(context, properties: unknown) {
    super(context, properties, Properties, true);
  }

  @InputStream()
  public async noop(event: FlowEvent) {
    const data = event.getData();
    if (this.properties.logData === true) {
      this.logger.log(data);
    }
    return this.emitEvent(data, event);
  }
}

class Properties {
  @IsBoolean()
  @IsOptional()
  logData?: boolean;
}
