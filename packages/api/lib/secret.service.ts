import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Secret } from './secret.interface';

export class SecretService extends DataService<Secret> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/secrets');
  }
}
