import { isAxiosError } from 'axios';
import { promises as fs } from 'fs';
import isPlainObject from 'lodash/isPlainObject';
import { join } from 'path';
import { PythonShell } from 'python-shell';
import interp from 'string-interp';
import { inspect } from 'util';

import { FlowLogger } from './FlowLogger';

export function fillTemplate(value: any, ...templateVariables: any): any {
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      value[key] = fillTemplate(value[key], ...templateVariables);
    }
    return value;
  } else if (Array.isArray(value) && value.length > 0) {
    value.forEach(function (v, index) {
      this[index] = fillTemplate(v, ...templateVariables);
    }, value);
    return value;
  } else if (value != null && typeof value === 'string' && value.includes('${')) {
    for (const variables of templateVariables) {
      try {
        const result = interp(value, variables || {});
        if (result) {
          return result;
        }
      } catch (err) {
        // ignore
      }
    }
  } else {
    return value;
  }
}

export function getCircularReplacer() {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}

export function toArray(value: string | string[] = []): string[] {
  return Array.isArray(value) ? value : value.split(',').map((v) => v.trim());
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deleteFiles(dir: string, ...filenames: string[]) {
  for (const filename of filenames) {
    await fs.unlink(join(dir, filename)).catch((err) => {
      /*ignore*/
    });
  }
}

export function handleApiError(error: any, logger: FlowLogger) {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? error.code ?? '';
    const statusText = error.response?.statusText ?? '';
    const url = error.config?.url ?? '[Unknown URL]';
    const method = error.config?.method?.toUpperCase() ?? '';
    let errorText = error.response?.data ?? '';

    if (typeof errorText !== 'string') {
      try {
        errorText = JSON.stringify(errorText, null, 2);
      } catch (_) {
        errorText = '[Unserializable error body]';
      }
    }
    logger.error(`${status} ${statusText}: ${method} request to ${url} failed\n${errorText}`);

    if (error.stack) {
      logger.error(error.stack);
    }
  } else {
    logger.error(error);
  }
}

export function runPyScript(scriptPath: string, data: any) {
  return new Promise<any>((resolve, reject) => {
    let pyData: any;

    const pyshell = new PythonShell(scriptPath, { mode: 'text', pythonOptions: ['-u'] });
    pyshell.send(JSON.stringify(data));
    pyshell.on('message', (message) => {
      try {
        pyData = JSON.parse(message);
      } catch (err) {
        pyData = message;
      }
    });
    pyshell.end((err, code, signal) => {
      if (err) {
        return reject(err);
      }
      return resolve(pyData);
    });
  });
}

/**
 * Truncates an object or string to the specified max length and depth
 */
export function truncate(msg: any, depth = 4, maxStringLength = 1000): string {
  let truncated = inspect(msg, { depth, maxStringLength });
  if (truncated.startsWith("'") && truncated.endsWith("'")) {
    truncated = truncated.substring(1, truncated.length - 1);
  }
  return truncated;
}
