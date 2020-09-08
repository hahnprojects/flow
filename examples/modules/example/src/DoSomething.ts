import { FlowEvent, FlowFunction, FlowResource, InputStream } from '@hahnpro/flow-sdk';
import { IsNumber } from 'class-validator';

@FlowFunction('example.resources.DoSomething')
export class DoSomething extends FlowResource {
  private readonly props: Properties;

  constructor(context, properties: unknown) {
    super(context);
    this.props = this.validateProperties(Properties, properties, true);
  }

  @InputStream()
  public async generateRandomNumber(event: FlowEvent) {
    const data = event.getData();

    const num = this.rnd(this.props.min, this.props.max);
    return this.emitOutput({ ...data, num });
  }

  private rnd(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}

class Properties {
  @IsNumber()
  min: number;

  @IsNumber()
  max: number;
}
