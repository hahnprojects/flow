export interface AssetType {
  id?: string;
  name: string;
  tags?: string[];
  allowedParents?: string[];
  allowedParent$name?: string;
  readPermissions: string[];
  readWritePermissions: string[];
  supertype?: string;
  supertype$name?: string;
  typeSchema: any;
  uiSchema: any;
  actions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Asset {
  id?: string;
  name: string;
  type: string | AssetType;
  type$name?: string;
  readPermissions: string[];
  readWritePermissions: string[];
  parent?: any | Asset;
  parent$name?: string;
  ancestors?: string[];
  tags?: string[];
  relations: any[];
  data?: any;
  image?: string;
  author?: string;
  revision?: number;
  attachments?: string[];
  notificationEndpoints?: string[];
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
