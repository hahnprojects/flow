import { Storage } from './storage.interface';

export interface Content {
  id?: string;
  fileId: string;
  filename: string;
  mimetype: string;
  size: number;
  readPermissions: string[];
  readWritePermissions: string[];
  tags?: string[];
  assets?: string[];
  files?: Storage[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export enum ReturnType {
  TEXT,
  JSON,
  NODEBUFFER,
  BLOB,
  ARRAYBUFFER,
  NODESTREAM,
}
