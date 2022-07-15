import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Secret } from './secret.interface';
import { TrashService } from './trash.service';

interface BaseService extends DataService<Secret>, TrashService<Secret> {}
@mix(DataService, TrashService)
class BaseService extends APIBase {}

export class SecretService extends BaseService {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/secrets');
  }
}
