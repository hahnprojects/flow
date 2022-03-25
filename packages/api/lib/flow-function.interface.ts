export interface FlowFunction {
  fqn: string;
  category: string;
  readPermissions: string[];
  readWritePermissions: string[];
  author: string;
  current: string;
  history: string[] | HistoryEntry[];
  name?: string;
  description?: string;
  icon?: string;
  isAbstract?: boolean;
  supertype?: string;
  propertiesSchema?: Schema;
  inputStreams?: Stream[];
  outputStreams?: Stream[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface HistoryEntry {
  author: string;
  createdAt: string;
  id: string;
}

interface Stream {
  name: string;
}

interface Schema {
  schema: {
    type: string;
    properties?: {
      [key: string]: SchemaProperty;
    };
  };
  layout?: any[];
  data?: any;
}

type SchemaPropertyType = 'array' | 'boolean' | 'number' | 'string';

interface SchemaProperty {
  type: SchemaPropertyType;
  title?: string;
  description?: string;
  default?: any;
  [key: string]: any;
}
