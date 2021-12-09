import { FlowElementContext } from './flow.interface';
import { FlowEvent } from './FlowEvent';

export interface Logger {
  debug(message, metadata?): void;
  error(message, metadata?): void;
  log(message, metadata?): void;
  warn(message, metadata?): void;
  verbose(message, metadata?): void;
}

/* tslint:disable:no-console */
export const defaultLogger: Logger = {
  debug: (msg, metadata?) => console.debug(msg),
  error: (msg, metadata?) => console.error(msg),
  log: (msg, metadata?) => console.log(msg),
  warn: (msg, metadata?) => console.warn(msg),
  verbose: (msg, metadata?) => console.log(msg, metadata),
};
/* tslint:enable:no-console */

export interface LoggerOptions {
  truncate: boolean;
}

export class FlowLogger implements Logger {
  private static getStackTrace() {
    // get stacktrace without extra dependencies
    let stack;

    try {
      throw new Error('');
    } catch (error) {
      stack = error.stack || '';
    }

    // cleanup stacktrace and remove calls within this file
    stack = stack
      .split('\n')
      .map((line) => line.trim())
      .filter((value) => !value.includes('Logger'));
    return stack.splice(1).join('\n');
  }

  constructor(
    private readonly metadata: FlowElementContext,
    private readonly logger: Logger = defaultLogger,
    private readonly publishEvent?: (event: FlowEvent) => Promise<void>,
  ) {}

  public debug = (message, options?: LoggerOptions) => this.publish(message, 'debug', options);
  public error = (message, options?: LoggerOptions) => this.publish(message, 'error', options);
  public log = (message, options?: LoggerOptions) => this.publish(message, 'info', options);
  public warn = (message, options?: LoggerOptions) => this.publish(message, 'warn', options);
  public verbose = (message, options?: LoggerOptions) => this.publish(message, 'verbose', options);

  private publish(message, level: string, options: LoggerOptions) {
    if (this.publishEvent) {
      const event = new FlowEvent(this.metadata, message, `flow.log.${level}`);
      this.publishEvent(event)?.catch((err) => this.logger.error(err, this.metadata));
    }
    // ensure correct message if message is an object
    // has no real effect if message is already a string
    // FIXME: not working as expected
    // const stackTrace = JSON.stringify(message) + '\n' + FlowLogger.getStackTrace();
    switch (level) {
      case 'debug':
        return this.logger.debug(message, { ...this.metadata, ...options });
      case 'error':
        return this.logger.error(message, { ...this.metadata, ...options });
      case 'warn':
        return this.logger.warn(message, { ...this.metadata, ...options });
      case 'verbose':
        return this.logger.verbose(message, { ...this.metadata, ...options });
      default:
        this.logger.log(message, { ...this.metadata, ...options });
    }
  }
}
