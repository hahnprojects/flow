export interface ResourceReference {
  id: string;
  resourceType: string;
  dependent?: boolean;
}

export interface Resource {
  id: string;
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
}
