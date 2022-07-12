import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Secret } from './secret.interface';
import { TrashService } from './trash.service';

interface MixedClass extends DataService<Secret>, TrashService<Secret> {}

@mix(DataService, TrashService)
class MixedClass extends APIBase {
  constructor(httpClient: HttpClient, basePath: string) {
    super(httpClient, basePath);
  }
}

export class SecretService extends MixedClass {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/secrets');
  }
}
