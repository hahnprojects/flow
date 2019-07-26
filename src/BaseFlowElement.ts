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

export class BaseFlowElement {
  private inputStreams: { [id: string]: (data: DataSet) => void } = {};
  private outputStreams: { [id: string]: () => DataSet } = {};
  private outputStreamListener: { [id: string]: Array<(data: DataSet) => void> } = {};

  constructor(protected readonly args: BaseArguments, protected readonly logger: Logger) {
    const streamId = 'default';
    this.setInputStream(streamId, this.onInputDefaultStream);
    this.outputStreams[streamId] = this.onOutputDefaultStream;
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
    this.logger.log(`defaultInput: ${data}`);
  }

  public onOutputDefaultStream(): DataSet {
    return {
      _time: new Date().toISOString(),
      id: this.args.id,
    };
  }

  protected fireOutputStream(streamName: string) {
    if (this.outputStreamListener[streamName]) {
      const stream = this.outputStreams[streamName];
      this.outputStreamListener[streamName].forEach((fire) => {
        fire(stream());
      });
    } else {
      this.logger.error('unkown output stream');
    }
  }

  protected toArray(arg: string | string[]): string[] {
    if (arg instanceof Array) {
      return arg;
    } else {
      return [arg];
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
