import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { AssetType } from './asset.interface';
import { Paginated } from './data.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { TrashService } from './trash.service';

interface BaseService extends DataService<AssetType>, TrashService<AssetType> {}
@mix(DataService, TrashService)
class BaseService extends APIBase {}

export class AssetTypesService extends BaseService {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/assettypes');
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
