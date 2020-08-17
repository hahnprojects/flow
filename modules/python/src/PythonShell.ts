import { FlowEvent, FlowFunction, FlowTask, InputStream } from '@hahnpro/flow-sdk';
import { IsNumber } from 'class-validator';
import { PythonShell } from 'python-shell';

@FlowFunction('python.tasks.python-shell')
export class Python extends FlowTask {
  private readonly props: Properties;

  constructor(context, properties: unknown) {
    super(context);
    this.props = this.validateProperties(Properties, properties, true);
  }

  @InputStream()
  public async handleInputStream(event: FlowEvent) {
    const data = event.getData();
    const { x } = data;

    const pyshell = new PythonShell(__dirname + '/algebra.py');
    const numbers = {
      a: this.props.a,
      b: this.props.b,
      x
    };

    pyshell.send(JSON.stringify(numbers));
    pyshell.on('message', (msg) => {
      const response = JSON.parse(msg);
      return this.emitOutput({ ...data, sum: response.sum, mul: response.mul, factorial: response.factorial});
    });
    pyshell.end((err, exitCode, exitSignal) => {
      if (err) {
        this.logger.error(err);
      }
    });
  }
}

class Properties {
  @IsNumber()
  a: number;

  @IsNumber()
  b: number;
}
