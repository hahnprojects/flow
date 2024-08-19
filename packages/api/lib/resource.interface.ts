export interface ResourceReference {
  id: string;
  resourceType: string;
  dependent?: boolean;
}

export interface Resource {
  id: string;
  owner?: Owner;
  name: string;
  readPermissions: string[];
  readWritePermissions: string[];
  description?: string;
  author?: string;
  tags?: string[];
  refs?: ResourceReference[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date;
  revision?: string;
  createdBy?: Author;
  updatedBy?: Author;
}

export interface Author {
  id: string;
  username: string;
  impersonatorId?: string;
  impersonatorUsername?: string;
}

export interface Owner {
  id: string;
  type: 'org' | 'user';
}
