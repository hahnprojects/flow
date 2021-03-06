import { DataService } from './data.service';
import { Event } from './events.interface';
import { HttpClient } from './http.service';

export class EventsService extends DataService<Event> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/events');
  }

  getLastEventByAssetAndGroup(assetId: string, group: string): Promise<Event> {
    return this.httpClient.get<Event>(`${this.basePath}/last/${assetId}/${group}`);
  }
}
