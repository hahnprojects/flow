import { FlowElementContext } from './flow.interface';
import { FlowEvent } from './FlowEvent';

export interface Logger {
  debug(message, metadata?): void;
  error(message, metadata?): void;
  log(message, metadata?): void;
  warn(message, metadata?): void;
  verbose(message, metadata?): void;
}

/* eslint-disable no-console */
export const defaultLogger: Logger = {
  debug: (msg, metadata?) => console.debug(msg),
  error: (msg, metadata?) => console.error(msg),
  log: (msg, metadata?) => console.log(msg),
  warn: (msg, metadata?) => console.warn(msg),
  verbose: (msg, metadata?) => console.log(msg, metadata),
};
/* eslint-enable no-console */

export interface LoggerOptions {
  truncate: boolean;
}

interface FlowLog {
  message: string;
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
    private readonly publishEvent?: (event: FlowEvent) => void,
  ) {}

  public debug = (message, options?: LoggerOptions) => this.publish(message, 'debug', options);
  public error = (message, options?: LoggerOptions) => this.publish(message, 'error', options);
  public log = (message, options?: LoggerOptions) => this.publish(message, 'info', options);
  public warn = (message, options?: LoggerOptions) => this.publish(message, 'warn', options);
  public verbose = (message, options?: LoggerOptions) => this.publish(message, 'verbose', options);

  /**
   * Parses a given message into a standardized FlowLogData object.
   * Ensures that the returned object always contains a `message` property of type string.
   *
   * @details Requirements for the output format of messages:
   * - Necessary for consistent logging and event publishing, because the OpenSearch index expects a specific structure: flat_object.
   * - The current UI expects a `message` property to be present, so we ensure it is always set.
   *
   * @param {any} message - The input message to be parsed. Can be of any type.
   * @returns {FlowLog} - A standardized object with a `message` property.
   */
  private parseMessageToFlowLog(message: any): FlowLog {
    const flowLog: FlowLog = { message: 'Unknown!' };

    if (typeof message.message === 'string') {
      flowLog.message = message.message;
    } else {
      try {
        flowLog.message = typeof message === 'string' ? message : JSON.stringify(message.message ?? message);
      } catch (e) {
        flowLog.message = 'Error: Could not stringify the message.';
      }
    }

    return flowLog;
  }

  private publish(message, level: string, options: LoggerOptions) {
    const flowLogData: FlowLog = this.parseMessageToFlowLog(message);

    if (this.publishEvent) {
      const event = new FlowEvent(this.metadata, flowLogData, `flow.log.${level}`);
      this.publishEvent(event);
    }

    // ensure correct message if message is an object
    // has no real effect if message is already a string
    // FIXME: not working as expected
    // const stackTrace = JSON.stringify(message) + '\n' + FlowLogger.getStackTrace();
    switch (level) {
      case 'debug':
        return this.logger.debug(flowLogData.message, { ...this.metadata, ...options });
      case 'error':
        return this.logger.error(flowLogData.message, { ...this.metadata, ...options });
      case 'warn':
        return this.logger.warn(flowLogData.message, { ...this.metadata, ...options });
      case 'verbose':
        return this.logger.verbose(flowLogData.message, { ...this.metadata, ...options });
      default:
        this.logger.log(flowLogData.message, { ...this.metadata, ...options });
    }
  }
}
