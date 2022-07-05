import { AssetType } from './asset.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Paginated } from './data.interface';
import { TrashService } from './trash.service';
import { mix } from 'ts-mixer';

export interface AssetTypesService extends DataService<AssetType>, TrashService<AssetType> {}

@mix(DataService, TrashService)
export class AssetTypesService {
  constructor(httpClient: HttpClient) {
  }

  public getRevisions(id: string): Promise<Paginated<AssetType[]>> {
    return this.httpClient.get<Paginated<AssetType[]>>(`${this.basePath}/${id}/revisions`);
  }

  public rollback(id: string, revisionId: string): Promise<AssetType> {
    return this.httpClient.put<AssetType>(`${this.basePath}/${id}/rollback`, { revisionId });
  }

  public deleteRevision(id: string, revisionId: string): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${id}/revisions/${revisionId}`);
  }
}
