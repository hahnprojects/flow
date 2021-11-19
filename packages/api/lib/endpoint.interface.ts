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
  notificationCheckInterval: number;
  notificationPauseInterval: number;
  nbOfNotificationsBetweenPauseInterval: number;
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

export interface NotificationPayload {
  subject: string;
  message: string;
  group?: string;
  level?: string;
  eventLink?: string;
  assetId?: string;
  assetName?: string;
  assetLink?: string;
}
