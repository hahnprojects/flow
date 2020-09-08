import { promises as fs } from 'fs';
import { join } from 'path';
import { PythonShell } from 'python-shell';
import interp from 'string-interp';

import { FlowLogger } from './FlowLogger';

export function fillTemplate(templateString: string, templateVariables: any): string {
  if (!templateString?.includes?.('${')) {
    return templateString;
  }
  return interp(templateString, templateVariables || {});
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
    await fs.unlink(join(dir, filename)).catch((err) => {});
  }
}

export function handleApiError(error: any, logger: FlowLogger) {
  if (error.isAxiosError) {
    if (error.response && error.response.data) {
      logger.error(error.response.data);
    } else {
      logger.error(`Error ${error.code}`);
      logger.error(error.config);
      if (error.stack) {
        logger.error(error.stack);
      }
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
