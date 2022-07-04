import { TrashService } from '../trash.service';

// TODO: continue here
export class TrashMockService<T> implements TrashService<T> {

  emptyTrash(offset: number): Promise<{ acknowledged: boolean; deletedCount: number }> {
    return Promise.resolve({ acknowledged: false, deletedCount: 0 });
  }

  getTrash(params: RequestParameter | undefined): Promise<Paginated<T[]>> {
    return Promise.resolve(undefined);
  }

  private http: HttpClient;
  private path: string;

  setTrashVals(httpClient: HttpClient, basePath): void {
  }

  trashRestoreAll(): Promise<T[]> {
    return Promise.resolve([]);
  }

  trashRestoreOne(id: string): Promise<T> {
    return Promise.resolve(undefined);
  }
  
}
