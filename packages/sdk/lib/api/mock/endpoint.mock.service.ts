import { Endpoint, EndpointInterface } from '../endpoint.interface';
import { DataMockService } from './data.mock.service';

export class EndpointMockService extends DataMockService<Endpoint> implements EndpointInterface {
  constructor(endpoints: Endpoint[]) {
    super();
    this.data = endpoints;
  }

  sendNotification(endpointId: string, subject: string, message: string, group: string) {
    const endpoint = this.getOne(endpointId, {});
    return Promise.resolve({ endpoint, subject, message, group });
  }

  readLastLogByGroup(endpointId: string, group: string) {
    return Promise.resolve({ id: 'endpointlog1', group: 'test', data: 'OK', createdAt: new Date(), updatedAt: new Date() });
  }
}
