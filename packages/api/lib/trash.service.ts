import { Paginated, RequestParameter } from './data.interface';
import { HttpClient } from './http.service';

export class TrashService<T> {
  constructor(protected http: HttpClient, protected path: string) {}
  initTrash(httpClient: HttpClient, basePath) {
    this.http = httpClient;
    this.path = basePath;
  }

  public trashRestoreAll(): Promise<T[]> {
    return this.http.put<T[]>(`${this.path}/trash/restore`, {});
  }

  public trashRestoreOne(id: string): Promise<T> {
    return this.http.put<T>(`${this.path}/trash/restore/${id}`, {});
  }

  public emptyTrash(offset: number): Promise<{ acknowledged: boolean; deletedCount: number }> {
    return this.http.delete(`${this.path}/trash/clean`, { params: { offset } });
  }

  public getTrash(params: RequestParameter = {}): Promise<Paginated<T[]>> {
    params.limit = params.limit || 0;
    params.page = params.page || 1;
    return this.http.get(`${this.path}/trash`, { params });
  }
}
