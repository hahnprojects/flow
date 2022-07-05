import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Secret } from './secret.interface';
import { TrashService } from './trash.service';
import { mix } from 'ts-mixer';

export interface SecretService extends DataService<Secret>, TrashService<Secret> {}

@mix(DataService, TrashService)
export class SecretService {
  constructor(httpClient: HttpClient) {
  }
}
