import { HttpClient } from './http.service';
import { DataService } from './data.service';
import { Endpoint, NotificationPayload, EndpointLog } from './endpoint.interface';

export class EndpointService extends DataService<Endpoint> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/notification/endpoints');
  }

  sendNotification(endpointId: string, payload: NotificationPayload): Promise<void> {
    return this.httpClient.post<void>(`${this.basePath}/${endpointId}`, payload);
  }

  readLastLogByGroup(endpointId: string, group: string): Promise<EndpointLog> {
    return this.httpClient.get(`${this.basePath}/${endpointId}/logs/${group}/last`);
  }
}
