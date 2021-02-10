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

export interface EndpointInterface extends DataInterface<Endpoint> {
  sendNotification(endpointId: string, subject: string, message: string);
}
