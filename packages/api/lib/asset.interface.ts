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

export interface AssetParent {
  id?: string;
  name: string;
  type: string | AssetType;
  readPermissions: string[];
  readWritePermissions: string[];
  parent?: any | Asset;
  ancestors?: string[];
  tags?: string[];
  relations?: any[];
  data?: any;
  image?: string;
  author?: string;
  revision?: number;
}

export interface Asset extends AssetParent {
  type$name?: string;
  parent$name?: string;
  attachments?: string[];
  notificationEndpoints?: string[];
  actions?: string[];
}

export interface AssetRevision extends AssetParent {
  originalId?: string;
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
