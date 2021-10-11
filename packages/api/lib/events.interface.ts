export interface Event {
  id?: string;
  name: string;
  description?: string;
  tags?: string[];
  readPermissions: string[];
  readWritePermissions: string[];
  assetRef?: string;
  assetRef$name?: string;
  alertRef?: string;
  tsRef?: string;
  eventRef?: string;
  cause: string;
  level: string;
  group?: string;
}
