import { Resource } from './resource.interface';
import { FlowDiagram, Flow } from './flow.interface';
import { Storage } from './storage.interface';

export interface FlowDeployment extends Resource {
  flow: string | Flow;
  diagram: string | FlowDiagram;
  artifact: Storage;
  flowModel: FlowModel;
  desiredStatus: string;
  actualStatus: string;
  target: string;
  statistic?: FlowDeploymentStatistic;
}

export interface FlowDeploymentStatistic {
  totalErrorCount: number;
  errorCountWeek: number;
  eventCountWeek: number;
  errorCounts: { timestamp: number; error: number }[];
  metrics?: Record<string, any>;
}

export interface FlowModel {
  elements: FlowModelElement[];
  connections: FlowConnection[];
  modules?: string[];
  properties?: Record<string, any>;
}

export interface FlowModelElement {
  id: string;
  name?: string;
  properties?: Record<string, any>;
  module: string;
  functionFqn: string;
}

export interface FlowConnection {
  id: string;
  name?: string;
  source: string;
  target: string;
  sourceStream?: string;
  targetStream?: string;
}

export interface FlowDeploymentMetrics {
  metrics: Metrics[];
  stats?: Stats;
}

export interface Metrics {
  timestamp: number;
  cpu: number;
  memory: number;
}

export interface Stats {
  cpu: StatsValues;
  memory: StatsValues;
}

export interface StatsValues {
  count: number;
  min: number;
  max: number;
  avg: number;
  sum: number;
}

export interface FlowLog {
  data?: any;
  datacontenttype?: string;
  deploymentId?: string;
  elementId?: string;
  eventId?: string;
  flowId?: string;
  subject: string;
  source?: string;
  time: string;
  type: string;
}
