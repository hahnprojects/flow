import { DataService } from './data.service';
import { Notification } from './notification.interface';
import { HttpClient } from './http.service';

export class NotificationService extends DataService<Notification> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/notifications');
  }
}
