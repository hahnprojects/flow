import { FlowEvent, FlowFunction, FlowTask, InputStream } from '@hahnpro/flow-sdk';
import { IsBoolean, IsOptional } from 'class-validator';

@FlowFunction('example.tasks.DoNothing')
export class DoNothing extends FlowTask {
  private readonly props: Properties;

  constructor(context, properties: unknown) {
    super(context);
    this.props = this.validateProperties(Properties, properties, true);
  }

  @InputStream()
  public async noop(event: FlowEvent) {
    const data = event.getData();
    if (this.props.logData === true) {
      this.logger.log(data);
    }
    return this.emitOutput(data);
  }
}

class Properties {
  @IsBoolean()
  @IsOptional()
  logData?: boolean;
}
