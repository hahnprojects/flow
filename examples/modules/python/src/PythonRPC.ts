import { FlowEvent, FlowFunction, FlowTask, InputStream } from '@hahnpro/flow-sdk';
import { IsNumber } from 'class-validator';
import { join } from 'path';

@FlowFunction('python.tasks.python-rpc')
export class PythonRPC extends FlowTask<Properties> {
  constructor(context, properties: unknown) {
    super(context, properties, Properties, true);
    // attach to stdout
    const shell = this.runPyRpcScript(join(__dirname, 'algebra_rpc.py'), this.properties.count);
    shell.addListener('stdout', (data) => this.logger.log('py: ' + data));
    shell.addListener('stderr', (data) => this.logger.error('py: ' + data));
  }

  @InputStream()
  public async handleInputStream(event: FlowEvent) {
    const { x } = event.getData();

    this.emitEvent(
      {
        sum: await this.sum(this.properties.a, this.properties.b, x),
        mul: await this.multiply(this.properties.a, this.properties.b, x),
        factorial: await this.factorial(this.properties.a),
        randomCalc: await this.executeRandomCalc(5),
      },
      event,
    );
  }

  private sum = (a: number, b: number, c: number) => this.callRpcFunction('sum', a, b, c);
  private multiply = (a: number, b: number, c: number) => this.callRpcFunction('multiply', a, b, c);
  private factorial = (n: number) => this.callRpcFunction('factorial', n);
  private executeRandomCalc = (n: number) => this.callRpcFunction('execute_random_calc', n);
}

class Properties {
  @IsNumber()
  a: number;

  @IsNumber()
  b: number;

  @IsNumber()
  count: number;
}

class InputProperties {
  @IsNumber()
  x: number;
}

class OutputProperties extends InputProperties {
  @IsNumber()
  sum: number;

  @IsNumber()
  mul: number;

  @IsNumber()
  factorial: number;
}
