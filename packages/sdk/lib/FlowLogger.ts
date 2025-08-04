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

export enum STACK_TRACE {
  FULL = 'full',
  ONLY_LOG_CALL = 'only-log-call',
}

export interface LoggerOptions {
  truncate: boolean;
  stackTrace?: STACK_TRACE;
}

interface FlowLog {
  message: string;
  stackTrace?: string;
}

export class FlowLogger implements Logger {
  private static getStackTrace(stacktrace: STACK_TRACE = STACK_TRACE.FULL) {
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
      .filter((value) => value.includes('at ') && !value.includes('Logger'));

    if (stacktrace === STACK_TRACE.ONLY_LOG_CALL && stack.length > 0) {
      stack = stack[0];
    } else {
      stack = stack.splice(1).join('\n');
    }
    return stack;
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
   * Parses a message into a FlowLog object, including optional stack trace information.
   *
   * @details Requirements for the output format of messages:
   * - Necessary for consistent logging and event publishing, because the OpenSearch index expects a specific structure: flat_object.
   * - The current UI expects a `message` property to be present, so we ensure it is always set.
   *
   * @param {any} message - The message to be logged. Can be a string, an object with a `message` property, or any other type.
   * @param {string} level - The log level (e.g., 'error', 'debug', 'warn', 'verbose').
   * @param {LoggerOptions} options - Additional options for logging, such as whether to include a stack trace.
   * @returns {FlowLog} - An object containing the parsed log message and optional stack trace.
   */
  private parseMessageToFlowLog(message: any, level: string, options: LoggerOptions): FlowLog {
    let flowLogMessage: string;
    if (!message) {
      flowLogMessage = 'No message provided!';
    } else if (typeof message.message === 'string') {
      flowLogMessage = message.message;
    } else if (typeof message === 'string') {
      flowLogMessage = message;
    } else {
      try {
        flowLogMessage = JSON.stringify(message.message ?? message);
      } catch (e) {
        flowLogMessage = 'Error: Could not stringify the message.';
      }
    }

    const flowLog: FlowLog = { message: flowLogMessage };
    if (['error', 'debug', 'warn', 'verbose'].includes(level) || options?.stackTrace) {
      flowLog.stackTrace = FlowLogger.getStackTrace(options?.stackTrace ?? STACK_TRACE.ONLY_LOG_CALL);
    }
    return flowLog;
  }

  private publish(message, level: string, options: LoggerOptions) {
    const flowLogData: FlowLog = this.parseMessageToFlowLog(message, level, options);

    if (this.publishEvent) {
      const event = new FlowEvent(this.metadata, flowLogData, `flow.log.${level}`);
      this.publishEvent(event);
    }

    const messageWithStackTrace = flowLogData.stackTrace ? `${flowLogData.message}\n${flowLogData.stackTrace}` : flowLogData.message;
    switch (level) {
      case 'debug':
        return this.logger.debug(messageWithStackTrace, { ...this.metadata, ...options });
      case 'error':
        return this.logger.error(messageWithStackTrace, { ...this.metadata, ...options });
      case 'warn':
        return this.logger.warn(messageWithStackTrace, { ...this.metadata, ...options });
      case 'verbose':
        return this.logger.verbose(messageWithStackTrace, { ...this.metadata, ...options });
      default:
        this.logger.log(messageWithStackTrace, { ...this.metadata, ...options });
    }
  }
}
