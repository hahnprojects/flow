import { FlowEvent, FlowFunction, FlowTask, InputStream } from '@hahnpro/flow-sdk';
import { IsNumber } from 'class-validator';
import { join } from 'path';
import { PythonShell } from 'python-shell';

@FlowFunction('python.tasks.python-shell')
export class Python extends FlowTask<Properties> {
  constructor(context, properties: unknown) {
    super(context, properties, Properties, true);
  }

  @InputStream()
  public async handleInputStream(event: FlowEvent) {
    const data = event.getData();
    const { x } = data;

    const pyshell = new PythonShell(join(__dirname, 'algebra.py'));
    const numbers = {
      a: this.properties.a,
      b: this.properties.b,
      x,
    };

    pyshell.send(JSON.stringify(numbers));
    pyshell.on('message', (msg) => {
      const response = JSON.parse(msg);
      return this.emitOutput({ ...data, sum: response.sum, mul: response.mul, factorial: response.factorial });
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
