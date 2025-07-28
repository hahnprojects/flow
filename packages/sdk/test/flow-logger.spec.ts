import { FlowLogger } from '../lib';
import { loggerMock } from './logger.mock';

describe('Flow Logger', () => {
  let flowLogger: FlowLogger;
  let parseLogMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    flowLogger = new FlowLogger({ id: 'testLogger' }, loggerMock);
    parseLogMessageSpy = jest.spyOn(flowLogger as any, 'parseMessageToFlowLog');
  });

  it('FLOW.FL.0: init', () => {
    expect(flowLogger).toBeDefined();
  });

  describe('FLOW.FL.1: parse log message correctly', () => {
    it('FLOW.FL.1.1: log with plain string', () => {
      const message = 'test debug message';
      const parsedMessage = (flowLogger as any).parseMessageToFlowLog(message);
      expect(Object.keys(parsedMessage)).toEqual(['message']);
      expect(typeof parsedMessage.message).toBe('string');
      expect(parsedMessage.message).toBe(message);
    });

    it('FLOW.FL.1.2: log with int', () => {
      const message = 1;
      const parsedMessage = (flowLogger as any).parseMessageToFlowLog(message);
      expect(Object.keys(parsedMessage)).toEqual(['message']);
      expect(typeof parsedMessage.message).toBe('string');
      expect(parsedMessage.message).toBe('1');
    });

    it('FLOW.FL.1.3: log with object', () => {
      const message = { rolf: 1 };
      const parsedMessage = (flowLogger as any).parseMessageToFlowLog(message);
      expect(Object.keys(parsedMessage)).toEqual(['message']);
      expect(typeof parsedMessage.message).toBe('string');
      expect(parsedMessage.message).toBe(JSON.stringify(message));
    });

    it('FLOW.FL.1.4: log with correct object', () => {
      const message = { message: 'test debug message 1' };
      const parsedMessage = (flowLogger as any).parseMessageToFlowLog(message);
      expect(Object.keys(parsedMessage)).toEqual(['message']);
      expect(typeof parsedMessage.message).toBe('string');
      expect(parsedMessage.message).toBe(message.message);
    });
  });

  describe('FLOW.FL.2: FlowLogger should parse every log message to FlowLog', () => {
    it('FLOW.FL.2.1: log with plain string', () => {
      const logSpy = jest.spyOn(flowLogger, 'debug');
      const message = 'test debug message';
      flowLogger.debug(message);
      expect(logSpy).toHaveBeenCalledWith(message);
      expect(parseLogMessageSpy).toHaveBeenCalledWith(message);
      expect(parseLogMessageSpy).toHaveReturnedWith(
        expect.objectContaining({
          message: 'test debug message',
        }),
      );
    });

    it('FLOW.FL.2.2: log with int', () => {
      const logSpy = jest.spyOn(flowLogger, 'debug');
      const message = 1;
      flowLogger.debug(message);
      expect(logSpy).toHaveBeenCalledWith(message);
      expect(parseLogMessageSpy).toHaveBeenCalledWith(message);
      expect(parseLogMessageSpy).toHaveReturnedWith(
        expect.objectContaining({
          message: '1',
        }),
      );
    });

    it('FLOW.FL.2.3: log with object', () => {
      const logSpy = jest.spyOn(flowLogger, 'debug');
      const message = { rolf: 1 };
      flowLogger.debug(message);
      expect(logSpy).toHaveBeenCalledWith(message);
      expect(parseLogMessageSpy).toHaveBeenCalledWith(message);
      expect(parseLogMessageSpy).toHaveReturnedWith(
        expect.objectContaining({
          message: JSON.stringify({ rolf: 1 }),
        }),
      );
    });

    it('FLOW.FL.2.4: log with correct object', () => {
      const logSpy = jest.spyOn(flowLogger, 'debug');
      const message = { message: '1' };
      flowLogger.debug(message);
      expect(logSpy).toHaveBeenCalledWith(message);
      expect(parseLogMessageSpy).toHaveBeenCalledWith(message);
      expect(parseLogMessageSpy).toHaveReturnedWith(
        expect.objectContaining({
          message: message.message,
        }),
      );
    });
  });
});
