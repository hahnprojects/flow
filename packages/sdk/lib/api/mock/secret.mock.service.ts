import { Secret, SecretInterface } from '../secret.interface';
import { DataMockService } from './data.mock.service';

export class SecretMockService extends DataMockService<Secret> implements SecretInterface {
  constructor(secrets: Secret[]) {
    super();
    this.data = secrets;
  }
}
