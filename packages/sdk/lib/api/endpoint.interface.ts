import { DataInterface } from './data.interface';

export interface Endpoint {
  id?: string;
  name: string;
  description?: string;
  status: string;
  config: {
    type: string;
    url?: string;
    authToken: string;
    recipients?: string[];
  };
  readPermissions: string[];
  readWritePermissions: string[];
}

export interface EndpointLog {
  id?: string;
  endpoint: string;
  type?: 'info' | 'error';
  data?: string;
  group?: string;
  updatedAt?: string;
}

export interface EndpointInterface extends DataInterface<Endpoint> {
  sendNotification(endpointId: string, subject: string, message: string, group: string, eventLink?: string);
  readLastLogByGroup(endpointId: string, group: string);
}
