import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { AssetType } from './asset.interface';
import { Paginated } from './data.interface';
import { DataService } from './data.service';
import { HttpClient, TokenOption } from './http.service';
import { TrashService } from './trash.service';

interface BaseService extends DataService<AssetType>, TrashService<AssetType> {}
@mix(DataService, TrashService)
class BaseService extends APIBase {}

export class AssetTypesService extends BaseService {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/assettypes');
  }

  public getRevisions(id: string, options: TokenOption = {}): Promise<Paginated<AssetType[]>> {
    return this.httpClient.get<Paginated<AssetType[]>>(`${this.basePath}/${id}/revisions`, options);
  }

  public rollback(id: string, revisionId: string, options: TokenOption = {}): Promise<AssetType> {
    return this.httpClient.put<AssetType>(`${this.basePath}/${id}/rollback`, { revisionId }, options);
  }

  public deleteRevision(id: string, revisionId: string, options: TokenOption = {}): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${id}/revisions/${revisionId}`, options);
  }
}
