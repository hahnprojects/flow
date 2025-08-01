import { loggerMock } from './mocks/logger.mock';
import { ContextManager } from '../lib';

describe('The ContextManage-Test spec', () => {
  let contextManager: ContextManager;

  beforeEach(() => {
    contextManager = new ContextManager(loggerMock, {});
  });

  test('CMT.1: Should be created', () => {
    expect(contextManager).toBeDefined();
  });

  describe('CMT.2: The ContextManager set method', () => {
    test('CMT.2.1: Should set a property', () => {
      contextManager.set('test', 'value');
      expect(contextManager.get('test')).toBe('value');
    });

    test('CMT.2.2: Should not set a property with flow.', () => {
      contextManager.set('flow.test', 'value');
      expect(loggerMock.error).toHaveBeenCalled();
    });

    test('CMT.2.3: Should overwrite a property', () => {
      contextManager.set('test', 'value');
      expect(contextManager.get('test')).toBe('value');
      contextManager.set('test', 'value2');
      expect(contextManager.get('test')).toBe('value2');
    });
  });

  describe('CMT.3: The ContextManager get method', () => {
    test('CMT.3.1: Should get a property', () => {
      contextManager.set('test', 'value');
      expect(contextManager.get('test')).toBe('value');
    });

    test('CMT.3.2: Should get undefined for not set property', () => {
      expect(contextManager.get('test')).toBeUndefined();
    });
  });

  describe('CMT.4: The ContextManager update method', () => {
    test('CMT.4.1: Should set the property to the value property', () => {
      contextManager.overwriteAllProperties({ test: 'bar' });
      contextManager.set('not-flow', 'foo');
      contextManager.updateFlowProperties({ test: 'baz' });

      expect(contextManager.get('not-flow')).toBe('foo');
      expect(contextManager.get('flow.test')).toBe('baz');
    });
  });
});
