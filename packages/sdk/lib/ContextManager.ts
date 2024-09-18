import { Logger } from './FlowLogger';
import { cloneDeep, get, set } from 'lodash';
import { fillTemplate } from './utils';

/**
 * Class representing a context manager for handling properties.
 */
export class ContextManager {
  private properties: Record<string, any>;

  /**
   * Constructor of the ContextManager.
   * @param {Logger} logger - The logger instance for logging messages.
   * @param {Record<string, any>} [properties={}] - Initial properties to set.
   */
  constructor(
    protected logger: Logger,
    properties: Record<string, any> = {},
  ) {
    this.properties = properties;
  }

  /**
   * Init or overwrite all properties.
   * @param properties
   */
  public overwriteAllProperties(properties: Record<string, any> = {}): void {
    this.properties = properties;
  }

  /**
   * Get a copy of the current properties.
   * @returns {Record<string, any>} A copy of the properties.
   */
  public getProperties(): Record<string, any> {
    return { ...this.properties };
  }

  /**
   * Set a property.
   * A property key starting with "flow." is reserved for the properties set by in UI and so it is not allowed to be set.
   * @param {string} keyOrPath - The key or the path of the property.
   * @param {any} value - The value of the property.
   */
  public set(keyOrPath: string, value: any): void {
    if (keyOrPath.startsWith('flow.')) {
      this.logger.error(
        `Set property of "${keyOrPath}" is not allowed, because it starts with "flow.", so it is reserved for the properties set by in UI.`,
      );
    } else {
      set(this.properties, keyOrPath, value);
    }
  }

  /**
   * Get a property value by key.
   * @param {string} keyOrPath - The key or the path of the property.
   * @returns {any} The value of the property.
   */
  public get(keyOrPath: string): any {
    return get(this.properties, keyOrPath, undefined);
  }

  public replaceAllPlaceholderProperties(properties: any) {
    return fillTemplate(cloneDeep(properties), this.properties);
  }
}
