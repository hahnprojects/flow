import { Event, EventsInterface } from './../events.interface';
import { DataMockService } from './data.mock.service';

export class EventsMockService extends DataMockService<Event> implements EventsInterface {
  constructor(events: Event[]) {
    super();
    this.data = events;
  }
}