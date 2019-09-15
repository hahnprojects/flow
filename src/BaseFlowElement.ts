export interface BaseArguments {
  id: string;
  deployment: string;
  diagram: string;
  name?: string;
  description?: string;
}

export interface DataSet {
  _time: string; // iso-date
  [key: string]: any;
}

export interface Logger {
  debug: (message, metadata?) => void;
  error: (message, metadata?) => void;
  log: (message, metadata?) => void;
  warn: (message, metadata?) => void;
  verbose: (message, metadata?) => void;
}

/* tslint:disable:no-console */
const defaultLogger: Logger = {
  debug: (msg, metadata?) => console.debug(msg),
  error: (msg, metadata?) => console.error(msg),
  log: (msg, metadata?) => console.log(msg),
  warn: (msg, metadata?) => console.warn(msg),
  verbose: (msg, metadata?) => console.log(msg),
};
/* tslint:enable:no-console */

class FlowLogger {
  private metadata: {
    deploymentId: string;
    diagramId: string;
    elementId: string;
  };
  constructor(private readonly logger: Logger, deploymentId: string, diagramId: string, elementId: string) {
    this.metadata = { deploymentId, diagramId, elementId };
  }
  debug = (message) => this.logger.debug(message, this.metadata);
  error = (message) => this.logger.error(message, this.metadata);
  log = (message) => this.logger.log(message, this.metadata);
  warn = (message) => this.logger.warn(message, this.metadata);
  verbose = (message) => this.logger.verbose(message, this.metadata);
}

export class BaseFlowElement {
  protected readonly logger: FlowLogger;
  private inputStreams: { [id: string]: (data: DataSet) => void } = {};
  private outputStreamListener: { [id: string]: Array<(data: DataSet) => void> } = {};

  constructor(protected readonly args: BaseArguments, logger: Logger = defaultLogger) {
    this.logger = new FlowLogger(logger, this.args.deployment, this.args.diagram, this.args.id);
    this.setInputStream('default', (data: DataSet) => this.onInputDefaultStream(data));
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

  public addOutputStreamsListener(streamName: string, listener: (data: DataSet) => void) {
    if (!this.outputStreamListener[streamName]) {
      this.outputStreamListener[streamName] = [];
    }
    this.outputStreamListener[streamName].push(listener);
  }

  public onInputDefaultStream(data: DataSet) {
    this.fireOutput(data);
  }

  protected fireOutput(data: DataSet, stream: string = 'default') {
    if (this.outputStreamListener[stream]) {
      this.logger.verbose(data);
      this.outputStreamListener[stream].forEach((listener) => listener(data));
    }
  }
}
