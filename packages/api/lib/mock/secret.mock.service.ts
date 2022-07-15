import { mix } from 'ts-mixer';

import { Secret } from '../secret.interface';
import { SecretService } from '../secret.service';
import { Paginated, RequestParameter } from '../data.interface';
import { APIBaseMock } from './api-base.mock';
import { DataMockService } from './data.mock.service';
import { TrashMockService } from './trash.mock.service';

interface BaseService extends DataMockService<Secret>, TrashMockService<Secret> {}
@mix(DataMockService, TrashMockService)
class BaseService extends APIBaseMock<Secret> {}

export class SecretMockService extends BaseService implements SecretService {
  constructor(secrets: Secret[]) {
    super(secrets);
  }

  deleteOne(contentId: string, force = false): Promise<Secret> {
    const content = this.data.find((v) => v.id === contentId);
    if (!content?.deletedAt && !force) {
      // put content in paper bin by setting deletedAt prop
      content.deletedAt = new Date().toISOString();
      return Promise.resolve(content);
    }
    return super.deleteOne(contentId);
  }

  getMany(params?: RequestParameter): Promise<Paginated<Secret[]>> {
    const page = this.getItems(params, false);
    return Promise.resolve(page);
  }
}
