export type FileType = 'original' | 'preview-sm' | 'preview-md' | 'preview-lg' | 'preview-xl';

export type StorageProvider = 's3' | 'mongo';

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

export interface Artifact extends Storage {
  version: string;
  functions?: string[];
}
