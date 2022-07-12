import { Endpoint, NotificationPayload } from '../endpoint.interface';
import { EndpointService } from '../endpoint.service';
import { DataMockService } from './data.mock.service';

export class EndpointMockService extends DataMockService<Endpoint> implements EndpointService {
  constructor(endpoints: Endpoint[]) {
    super();
    this.data = endpoints;
  }

  sendNotification(_endpointId: string, _payload: NotificationPayload) {
    return Promise.resolve();
  }

  readLastLogByGroup(_endpointId: string, _group: string) {
    return Promise.resolve({
      id: 'endpointlog1',
      endpoint: '',
      group: 'test',
      data: 'OK',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
