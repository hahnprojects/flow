export interface JsonSchemaForm {
  schema: JsonSchema;
  layout: Record<string, any> | Record<string, any>[];
}

export type JsonSchemaTypeName = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

export type JsonSchemaType = string | number | boolean | { [key: string]: JsonSchemaType } | JsonSchemaArray | null;

export type JsonSchemaArray = Array<JsonSchemaType>;

export interface JsonSchema {
  default?: JsonSchemaType;
  description?: string;
  items?: JsonSchema | JsonSchema[];
  properties?: Record<string, JsonSchema>;
  required?: boolean | string[];
  title?: string;
  type?: JsonSchemaTypeName | JsonSchemaTypeName[];
}
