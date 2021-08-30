import { Secret } from '../secret.interface';
import { SecretService } from '../secret.service';
import { DataMockService } from './data.mock.service';

export class SecretMockService extends DataMockService<Secret> implements SecretService {
  constructor(secrets: Secret[]) {
    super();
    this.data = secrets;
  }
}
