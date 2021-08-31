import { HttpClient } from './http.service';
import { DataService } from './data.service';
import { Endpoint, EndpointInterface, EndpointLog } from './endpoint.interface';

export class EndpointService extends DataService<Endpoint> implements EndpointInterface {
  constructor(httpClient: HttpClient) {
    super(httpClient, process.env.DEBUG_ENDPOINT_URL || 'api/notification/endpoints');
  }

  sendNotification(endpointId: string, subject: string, message: string, group: string, eventLink?: string): Promise<void> {
    const body = { subject, message, group, ...(eventLink && { eventLink }) };
    return this.httpClient.post<void>(`${this.basePath}/${endpointId}`, body);
  }

  readLastLogByGroup(endpointId: string, group: string): Promise<EndpointLog> {
    return this.httpClient.get(`${this.basePath}/${endpointId}/logs/${group}/last`);
  }
}
