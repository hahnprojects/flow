import { DataService } from './data.service';
import { Event, EventsInterface } from './events.interface';
import { HttpClient } from './http.service';

export class EventsService extends DataService<Event> implements EventsInterface {
  constructor(httpClient: HttpClient) {
    super(httpClient, process.env.DEBUG_EVENTS_URL || 'api/events');
  }
}
