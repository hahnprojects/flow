import { HttpClient } from './http.service';
import { DataService } from './data.service';
import { Endpoint, EndpointInterface } from './endpoint.interface';

export class EndpointService extends DataService<Endpoint> implements EndpointInterface {
  constructor(httpClient: HttpClient) {
    super(httpClient, process.env.DEBUG_ENDPOINT_URL || 'api/notification/endpoints');
  }

  sendNotification(endpointId: string, subject: string, message: string): Promise<void> {
    const body = { subject, message };
    return this.httpClient.post<void>(`${this.basePath}/${endpointId}`, body);
  }
}
