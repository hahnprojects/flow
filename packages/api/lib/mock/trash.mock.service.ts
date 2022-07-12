import { TrashService } from '../trash.service';
import { Paginated, RequestParameter } from '../data.interface';
import { HttpClient } from '../http.service';

export class TrashMockService<T> extends TrashService<T> {
  protected trashData: T[] = [];
  protected deleteOnecbf;

  initTrash(httpClient: HttpClient, basePath, data = [], deleteOnecbf?) {
    super.initTrash(httpClient, basePath);
    this.trashData = data;
    this.deleteOnecbf = deleteOnecbf;
  }

  public trashRestoreAll(): Promise<T[]> {
    const deleted = this.trashData.filter((v) => v['deletedAt']);
    for (const asset of deleted) {
      delete asset['deletedAt'];
    }
    return Promise.resolve(deleted);
  }

  public trashRestoreOne(id: string): Promise<T> {
    const deleted = this.trashData.find((v) => v['id'] === id);
    delete deleted['deletedAt'];
    return Promise.resolve(deleted);
  }

  public async emptyTrash(offset: number): Promise<{ acknowledged: boolean; deletedCount: number }> {
    const dateOffsSeconds = Math.round(new Date().getTime() / 1000) - offset;
    const date = new Date(dateOffsSeconds * 1000);
    const trash = this.trashData.filter((v) => new Date(v['deletedAt']) < date);
    await Promise.all(trash.map((v) => this.deleteOnecbf(v['id'])));
    return Promise.resolve({ acknowledged: true, deletedCount: trash.length });
  }

  public getTrash(params?: RequestParameter): Promise<Paginated<T[]>> {
    const page = this.getItems(params, true);
    return Promise.resolve(page);
  }

  protected getItems(params: RequestParameter, deleted = false) {
    const data = this.trashData.filter((item) => !!item['deletedAt'] === deleted);
    const page: Paginated<T[]> = {
      docs: data,
      limit: params && params.limit ? params.limit : Number.MAX_SAFE_INTEGER,
      total: data.length,
    };
    return page;
  }
}
