import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Secret } from './secret.interface';
import { TrashService } from './trash.service';
import { mix } from 'ts-mixer';

interface MixedClass extends DataService<Secret>, TrashService<Secret> {}

@mix(DataService, TrashService)
class MixedClass {
  constructor(httpClient: HttpClient, basePath) {}
}

export class SecretService extends MixedClass {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/secrets');
    this.initData(httpClient, '/secrets');
    this.initTrash(httpClient, '/secrets');
  }
}
