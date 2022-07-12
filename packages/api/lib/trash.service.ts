import { APIBase } from './api-base';
import { Paginated, RequestParameter } from './data.interface';
import { HttpClient } from './http.service';

export class TrashService<T> extends APIBase {
  constructor(httpClient: HttpClient, basePath: string) {
    super(httpClient, basePath);
  }

  public trashRestoreAll(): Promise<T[]> {
    return this.httpClient.put<T[]>(`${this.basePath}/trash/restore`, {});
  }

  public trashRestoreOne(id: string): Promise<T> {
    return this.httpClient.put<T>(`${this.basePath}/trash/restore/${id}`, {});
  }

  public emptyTrash(offset: number): Promise<{ acknowledged: boolean; deletedCount: number }> {
    return this.httpClient.delete(`${this.basePath}/trash/clean`, { params: { offset } });
  }

  public getTrash(params: RequestParameter = {}): Promise<Paginated<T[]>> {
    params.limit = params.limit || 0;
    params.page = params.page || 1;
    return this.httpClient.get(`${this.basePath}/trash`, { params });
  }
}
