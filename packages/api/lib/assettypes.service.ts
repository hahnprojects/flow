import { AssetType } from './asset.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Paginated } from './data.interface';

export class AssetTypesService extends DataService<AssetType> {
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
