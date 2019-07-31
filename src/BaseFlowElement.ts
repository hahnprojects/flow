export interface BaseArguments {
  id: string;
  name: string;
  description: string;
}

export interface DataSet {
  _time: string; // iso-date
  [key: string]: any;
}

export interface Logger {
  debug: (message) => void;
  error: (message) => void;
  log: (message) => void;
  warn: (message) => void;
}

/* tslint:disable:no-console */
const defaultLogger: Logger = {
  debug: (msg) => console.log(msg),
  error: (msg) => console.error(msg),
  log: (msg) => console.log(msg),
  warn: (msg) => console.warn(msg),
};
/* tslint:enable:no-console */

export class BaseFlowElement {
  private inputStreams: { [id: string]: (data: DataSet) => void } = {};
  private outputStreams: { [id: string]: () => DataSet } = {};
  private outputStreamListener: { [id: string]: Array<(data: DataSet) => void> } = {};

  constructor(protected readonly args: BaseArguments, protected readonly logger: Logger = defaultLogger) {
    this.setInputStream('default', (data: DataSet) => this.onInputDefaultStream(data));
    this.setOutputStream('default', () => this.onOutputDefaultStream());
  }

  public emitInputStream(id: string, data: DataSet) {
    if (this.inputStreams[id]) {
      this.inputStreams[id](data);
    } else {
      this.logger.error(`InputStream ${id} is not registered (${this.args.id})`);
    }
  }

  public setInputStream(id: string, callback: (data: DataSet) => void) {
    this.inputStreams[id] = callback;
  }

  public setOutputStream(id: string, callback: () => DataSet) {
    this.outputStreams[id] = callback;
  }

  public addOutputStreamsListener(streamName: string, listener: (data: DataSet) => void) {
    if (!this.outputStreamListener[streamName]) {
      this.outputStreamListener[streamName] = [];
    }
    this.outputStreamListener[streamName].push(listener);
  }

  public onInputDefaultStream(data: DataSet) {
    this.logger.log(data);
  }

  public onOutputDefaultStream(): DataSet {
    return {
      _time: new Date().toISOString(),
      id: this.args.id,
    };
  }

  protected fireOutputStream(streamName: string = 'default') {
    if (this.outputStreamListener[streamName]) {
      const stream = this.outputStreams[streamName];
      this.outputStreamListener[streamName].forEach((listener) => {
        listener(stream());
      });
    }
  }

  protected fireOutput(data: DataSet, streamName: string = 'default') {
    if (this.outputStreamListener[streamName]) {
      this.outputStreamListener[streamName].forEach((listener) => listener(data));
    }
  }
}
