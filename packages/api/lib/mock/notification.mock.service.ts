import { DataMockService } from './data.mock.service';
import { Notification } from '../notification.interface';
import { NotificationService } from '../notification.service';

export class NotificationMockService extends DataMockService<Notification> implements NotificationService {
  constructor(notifications: Notification[]) {
    super();
    this.data = notifications;
  }
}
