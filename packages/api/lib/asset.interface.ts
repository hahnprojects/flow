export interface Asset {
  id?: string;
  name: string;
  type: string | AssetType;
  type$name?: string;
  readPermissions: string[];
  readWritePermissions: string[];
  tags?: string[];
  parent?: any | Asset;
  parent$name?: string;
  data?: any;
  attachments?: string[];
  image?: string;
  actions?: string[];
  notificationEndpoints?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetType {
  id?: string;
  name: string;
  tags?: string[];
  allowedParent?: string;
  allowedParent$name?: string;
  readPermissions: string[];
  readWritePermissions: string[];
  typeSchema: any;
  supertype?: string;
  supertype$name?: string;
  uiSchema: any;
  actions?: string[];
  createdAt?: string;
  updatedAt?: string;
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
  responseType?: string;
  readPermissions: string[];
  readWritePermissions: string[];
}
