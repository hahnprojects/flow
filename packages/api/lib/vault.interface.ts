export interface VaultSecret {
  id?: string;
  name: string;
  secret?: string;
  tags?: string[];
  version?: number;
  readPermissions: string[];
  readWritePermissions: string[];
  updatedAt?: string;
}
