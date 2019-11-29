type FileType = 'original' | 'preview-sm' | 'preview-md' | 'preview-lg';

type StorageProvider = 's3' | 'mongo';

interface Storage {
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
