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
  notificationCheck: number;
  notificationCount: number;
  notificationPause: number;
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
