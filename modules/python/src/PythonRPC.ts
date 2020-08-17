import { FlowEvent, FlowFunction, FlowTask, InputStream, RPCClient } from '@hahnpro/flow-sdk';
import { IsNumber } from 'class-validator';

@FlowFunction('python.tasks.python-rpc')
export class PythonRPC extends FlowTask {
  private readonly props: Properties;

  private client: RPCClient;

  private sum;
  private multiply;
  private factorial;

  constructor(context, properties: unknown) {
    super(context);
    this.props = this.validateProperties(Properties, properties, true);
  }

  @InputStream()
  public async handleInputStream(event: FlowEvent) {
    if (!this.client) {
      this.client = await RPCClient.getInstance('rpc');
      this.sum = this.client.declareFunction('sum');
      this.multiply = this.client.declareFunction('multiply');
      this.factorial = this.client.declareFunction('factorial');
    }

    const data = event.getData();
    const { x } = data;

    this.emitOutput({
      ...data,
      sum: await this.sum(this.props.a, this.props.b, x),
      mul: await this.multiply(this.props.b, this.props.b, x),
      factorial: await this.factorial(x)
    });
  }

}

class Properties {
  @IsNumber()
  a: number;

  @IsNumber()
  b: number;
}