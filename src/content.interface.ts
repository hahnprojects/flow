export interface Content {
  id?: string;
  filename: string;
  metadata: {
    mimetype: string;
    readPermissions: string[];
    readWritePermissions: string[];
    tags?: string[];
    assets?: string[];
  };
  uploadDate?: string;
}
