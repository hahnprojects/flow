import FormData from 'form-data';
import { DataInterface } from './data.interface';

export interface Asset {
  id?: string;
  name: string;
  type: string | AssetType;
  readPermissions: string[];
  readWritePermissions: string[];
  tags?: string[];
  parent?: any | Asset;
  data?: object;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetType {
  id?: string;
  name: string;
  allowedParent?: string;
  readPermissions: string[];
  readWritePermissions: string[];
  typeSchema: object;
  uiSchema: object;
}

export interface Attachment {
  id?: string;
  filename: string;
  metadata: {
    mimetype: string;
  };
}

export interface Action {
  id?: string;
  name?: string;
  description?: string;
  type?: string;
  method?: string;
  authToken?: string;
  isAuthFromAsset?: boolean;
  url?: string;
  data?: string;
}

export interface AssetInterface extends DataInterface<Asset> {
  addAttachment(id: string, form: FormData): Promise<Asset>;
}