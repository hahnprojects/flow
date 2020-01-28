import { FlowLogger } from './FlowLogger';

export function fillTemplate(templateString: string, templateVariables: object): string {
  if (templateString === undefined) {
    return undefined;
  }
  const keys = Object.keys(templateVariables);
  const values = Object.values(templateVariables);

  // tslint:disable-next-line
  const templateFunction = new Function(...keys, `return \`${templateString}\`;`);
  return templateFunction(...values);
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
