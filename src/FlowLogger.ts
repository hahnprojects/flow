import { ElementMetadata } from './FlowElement';

export interface Logger {
  debug(message, metadata?): void;
  error(message, metadata?): void;
  log(message, metadata?): void;
  warn(message, metadata?): void;
  verbose(message, metadata?): void;
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

export class FlowLogger implements Logger {
  private readonly logger: Logger;
  private metadata: {
    deploymentId: string;
    diagramId: string;
    elementId: string;
  };

  constructor({ deploymentId = '', diagramId = '', id: elementId }: ElementMetadata, logger: Logger = defaultLogger) {
    this.logger = logger;
    this.metadata = { deploymentId, diagramId, elementId };
  }

  debug = (message) => this.logger.debug(message, this.metadata);
  error = (message) => this.logger.error(message, this.metadata);
  log = (message) => this.logger.log(message, this.metadata);
  warn = (message) => this.logger.warn(message, this.metadata);
  verbose = (message) => this.logger.verbose(message, this.metadata);
}
