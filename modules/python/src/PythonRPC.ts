import { FlowEvent, FlowFunction, FlowTask, InputStream } from '@hahnpro/flow-sdk';
import { IsNumber } from 'class-validator';
import { join } from 'path';

@FlowFunction('python.tasks.python-rpc')
export class PythonRPC extends FlowTask {
  private readonly props: Properties;

  constructor(context, properties: unknown) {
    super(context);
    this.props = this.validateProperties(Properties, properties, true);
    this.runPyRpcScript(join(__dirname, 'algebra_rpc.py'));
  }

  @InputStream()
  public async handleInputStream(event: FlowEvent) {
    const data = event.getData();
    const { x } = data;

    this.emitOutput({
      ...data,
      sum: await this.sum(this.props.a, this.props.b, x),
      mul: await this.multiply(this.props.a, this.props.b, x),
      factorial: await this.factorial(this.props.a),
    });
  }

  private sum = (a: number, b: number, c: number) => this.callRpcFunction('sum', a, b, c);
  private multiply = (a: number, b: number, c: number) => this.callRpcFunction('multiply', a, b, c);
  private factorial = (n: number) => this.callRpcFunction('factorial', n);
}

class Properties {
  @IsNumber()
  a: number;

  @IsNumber()
  b: number;
}
