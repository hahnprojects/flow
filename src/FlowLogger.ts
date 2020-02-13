import { ElementMetadata } from './FlowElement';
import { FlowEvent } from './FlowEvent';

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
  verbose: (msg, metadata?) => console.log(msg, metadata),
};
/* tslint:enable:no-console */

export class FlowLogger implements Logger {
  constructor(
    private readonly metadata: ElementMetadata,
    private readonly logger: Logger = defaultLogger,
    private readonly publishEvent?: (event: FlowEvent) => Promise<void>,
  ) {}

  public debug = (message) => this.publish(message, 'debug');
  public error = (message) => this.publish(message, 'error');
  public log = (message) => this.publish(message, 'info');
  public warn = (message) => this.publish(message, 'warn');
  public verbose = (message) => this.publish(message, 'verbose');

  private publish(message, level: string) {
    if (this.publishEvent) {
      const event = new FlowEvent(this.metadata, message, `flow.log.${level}`);
      this.publishEvent(event);
    }
    switch (level) {
      case 'debug':
        return this.logger.debug(message, this.metadata);
      case 'error':
        return this.logger.error(message, this.metadata);
      case 'warn':
        return this.logger.warn(message, this.metadata);
      case 'verbose':
        return this.logger.verbose(message, this.metadata);
      default:
        this.logger.log(message, this.metadata);
    }
  }
}
