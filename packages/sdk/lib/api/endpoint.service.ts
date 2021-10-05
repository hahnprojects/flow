import { HttpClient } from './http.service';
import { DataService } from './data.service';
import { Endpoint, EndpointLog } from './endpoint.interface';

export class EndpointService extends DataService<Endpoint> {
  constructor(httpClient: HttpClient) {
    super(httpClient, process.env.DEBUG_ENDPOINT_URL || 'api/notification/endpoints');
  }

  sendNotification(
    endpointId: string,
    subject: string,
    message: string,
    group: string,
    eventLink?: string,
    assetLink?: string,
  ): Promise<void> {
    const body = { subject, message, group, ...(eventLink && { eventLink }), ...(assetLink && { assetLink }) };
    return this.httpClient.post<void>(`${this.basePath}/${endpointId}`, body);
  }

  readLastLogByGroup(endpointId: string, group: string): Promise<EndpointLog> {
    return this.httpClient.get(`${this.basePath}/${endpointId}/logs/${group}/last`);
  }
}
