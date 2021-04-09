export interface FlowContext {
  deploymentId?: string;
  diagramId?: string;
  flowId?: string;
}

export interface FlowElementContext extends FlowContext {
  id: string;
  name?: string;
  functionFqn?: string;
  inputStreamId?: string;
}

export interface DeploymentMessage extends Record<string, any> {
  elementId?: string;
}

interface FlowElement {
  id: string;
  name?: string;
  properties?: Record<string, any>;
  module: string;
  functionFqn: string;
}

interface FlowConnection {
  id: string;
  name?: string;
  source: string;
  target: string;
  sourceStream?: string;
  targetStream?: string;
}

export interface Flow {
  elements: FlowElement[];
  connections: FlowConnection[];
  modules?: string[];
  properties?: Record<string, any>;
  context?: FlowContext;
}

export interface StreamOptions {
  concurrent?: number;
}

export type ClassType<T> = new (...args: any[]) => T;
