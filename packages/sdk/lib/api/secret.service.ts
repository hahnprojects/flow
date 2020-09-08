import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Secret, SecretInterface } from './secret.interface';

export class SecretService extends DataService<Secret> implements SecretInterface {
  constructor(httpClient: HttpClient) {
    super(httpClient, process.env.DEBUG_SECRET_URL || '/api/secrets');
  }
}
