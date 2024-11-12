import { Logger } from './FlowLogger';
import { cloneDeep, get, isPlainObject, set } from 'lodash';
import { fillTemplate } from './utils';
import interp from 'string-interp';

/**
 * Class representing a context manager for handling properties.
 */
export class ContextManager {
  private properties: Record<string, any>;

  /**
   * Constructor of the ContextManager.
   * @param {Logger} logger - The logger instance for logging messages.
   * @param {Record<string, any>} [flowProperties={}] - Initial properties to set.
   */
  constructor(
    protected logger: Logger,
    flowProperties: Record<string, any> = {},
  ) {
    this.properties = { flow: flowProperties };
  }

  /**
   * Init or overwrite all properties.
   * @param properties
   */
  public overwriteAllProperties(properties: Record<string, any> = {}): void {
    this.properties = { flow: properties };
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
    return flowInterpolate(cloneDeep(properties), this.properties);
  }
}

export function flowInterpolate(value: any, properties: Record<string, any>): any {
  if (!properties) {
    return value;
  }
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      value[key] = flowInterpolate(value[key], properties);
    }
    return value;
  } else if (Array.isArray(value) && value.length > 0) {
    value.forEach(function (v, index) {
      this[index] = flowInterpolate(v, properties);
    }, value);
    return value;
  } else if (value != null && typeof value === 'string' && value.startsWith('${')) {
    // get ${...} blocks and replace the ones that start with flow. in a new string
    const blockRegEx = /\$\{\s*(\S+)\s*}/g;
    let newValue = value;
    let m: RegExpExecArray;
    do {
      m = blockRegEx.exec(value);
      if (m?.[1].startsWith('flow.')) {
        newValue = newValue.replace(m[0], interpolate(m[0], { flow: properties.flow }));
      }
    } while (m);
    return newValue;
  } else {
    return value;
  }
}

function interpolate(text: string, templateVariables: Record<string, any>): string {
  try {
    return interp(text, templateVariables) ?? text;
  } catch (err) {
    return text;
  }
}
