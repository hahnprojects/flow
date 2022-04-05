import { Resource } from './resource.interface';
import { JsonSchemaForm } from './schema.interface';
import { FlowDeployment } from './flow-deployment.interface';

export interface FlowDto extends Resource {
  diagram: string | FlowDiagram;
  deployments?: string[] | FlowDeployment[];
  dashboard?: DashboardItem[];
  propertiesSchema?: JsonSchemaForm;
}

export interface DashboardItem {
  id: string;
  cols: number;
  rows: number;
  x: number;
  y: number;
}

export interface FlowDiagram {
  id: string;
  flow: string | FlowDto;
  json: string;
  author: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deleteddAt?: Date | string;
}
