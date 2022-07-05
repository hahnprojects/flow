import { Secret } from '../secret.interface';
import { DataMockService } from './data.mock.service';
import { TrashMockService } from './trash.mock.service';
import { mix, settings } from 'ts-mixer';
import { Paginated, RequestParameter } from '../data.interface';

settings.initFunction = 'initMock';

interface MixedClass extends DataMockService<Secret>, TrashMockService<Secret> {}

@mix(DataMockService, TrashMockService)
class MixedClass {}

export class SecretMockService extends MixedClass {
  constructor(secrets: Secret[]) {
    super();
    this.data = secrets;
    this.initMock(secrets);
  }

  public initMock(secrets: Secret[]) {
    this.data = secrets;
    this.initData(null, null);
    this.initTrash(null, null, secrets, this.deleteOne);
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
