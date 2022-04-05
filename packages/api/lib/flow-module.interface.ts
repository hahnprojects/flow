import { Artifact } from './storage.interface';

export interface FlowModule {
  name: string;
  description?: string;
  artifacts: Artifact[];
  author: string;
  tags?: string[];
  functions: string[];
  readPermissions: string[];
  readWritePermissions: string[];
  createdAt?: string;
  updatedAt?: string;
}
