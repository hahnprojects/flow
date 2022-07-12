import { TrashService } from '../trash.service';
import { Paginated, RequestParameter } from '../data.interface';
import { APIBaseMock } from './api-base.mock';

export class TrashMockService<T extends { id?: string }> extends TrashService<T> implements APIBaseMock<T> {
  data: T[] = [];
  protected deleteOnecbf;

  constructor() {
    super(null, null);
  }

  public trashRestoreAll(): Promise<T[]> {
    const deleted = this.data.filter((v) => v['deletedAt']);
    for (const asset of deleted) {
      delete asset['deletedAt'];
    }
    return Promise.resolve(deleted);
  }

  public trashRestoreOne(id: string): Promise<T> {
    const deleted = this.data.find((v) => v['id'] === id);
    delete deleted['deletedAt'];
    return Promise.resolve(deleted);
  }

  public async emptyTrash(offset: number): Promise<{ acknowledged: boolean; deletedCount: number }> {
    const dateOffsSeconds = Math.round(new Date().getTime() / 1000) - offset;
    const date = new Date(dateOffsSeconds * 1000);
    const trashIds = this.data.filter((v) => new Date(v['deletedAt']) < date).map((v) => v.id);
    this.data = this.data.filter((item) => !trashIds.includes(item.id));
    return Promise.resolve({ acknowledged: true, deletedCount: trashIds.length });
  }

  public getTrash(params?: RequestParameter): Promise<Paginated<T[]>> {
    const page = this.getItems(params, true);
    return Promise.resolve(page);
  }

  protected getItems(params: RequestParameter, deleted = false) {
    const data = this.data.filter((item) => !!item['deletedAt'] === deleted);
    const page: Paginated<T[]> = {
      docs: data,
      limit: params && params.limit ? params.limit : Number.MAX_SAFE_INTEGER,
      total: data.length,
    };
    return page;
  }
}
