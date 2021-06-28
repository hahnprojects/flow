import FormData from 'form-data';
import { DataInterface } from './data.interface';
import { Readable } from 'stream';

type FileType = 'original' | 'preview-sm' | 'preview-md' | 'preview-lg';

type StorageProvider = 's3' | 'mongo';

export interface Storage {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  createdAt: string;
  provider?: StorageProvider;
  type?: FileType;
  md5?: string;
}

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
}

export interface ContentInterface extends DataInterface<Content> {
  upload(form: FormData): Promise<Content>;
  download(id: string, raw?: boolean): Promise<Blob | ArrayBuffer>;
  download(id: string, returnType: ReturnType.TEXT): Promise<string>;
  download(id: string, returnType: ReturnType.JSON): Promise<Record<string, unknown>>;
  download(id: string, returnType: ReturnType.NODEBUFFER): Promise<Buffer>;
  download(id: string, returnType: ReturnType.BLOB): Promise<Blob>;
  download(id: string, returnType: ReturnType.ARRAYBUFFER): Promise<ArrayBuffer>;
  download(id: string, returnType: ReturnType.NODESTREAM): Promise<Readable>;
}

export enum ReturnType {
  TEXT,
  JSON,
  NODEBUFFER,
  BLOB,
  ARRAYBUFFER,
  NODESTREAM,
}
