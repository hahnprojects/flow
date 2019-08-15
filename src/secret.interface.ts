export interface Secret {
  id?: string;
  name: string;
  key: string;
  readPermissions: string[];
  readWritePermissions: string[];
}
