import { FlowEvent, FlowFunction, FlowResource, InputStream } from '@hahnpro/flow-sdk';
import { IsNumber } from 'class-validator';

@FlowFunction('example.resources.DoSomething')
export class DoSomething extends FlowResource<Properties> {
  constructor(context, properties: unknown) {
    super(context, properties, Properties, true);
  }

  @InputStream()
  public async generateRandomNumber(event: FlowEvent) {
    const num = this.rnd(this.properties.min, this.properties.max);
    return this.emitEvent({ num }, event);
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

class InputProperties {}

class OutputProperties {
  @IsNumber()
  num: number;
}
