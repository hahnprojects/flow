import { Event } from '../events.interface';
import { EventsService } from '../events.service';
import { DataMockService } from './data.mock.service';

export class EventsMockService extends DataMockService<Event> implements EventsService {
  constructor(events: Event[]) {
    super();
    this.data = events;
  }

  getLastEventByAssetAndGroup(_assetId: string, _group: string): Promise<Event> {
    return Promise.resolve(this.data[this.data.length - 1]);
  }
}
