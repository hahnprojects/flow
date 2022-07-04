import FormData from 'form-data';
import { Asset, AssetRevision } from './asset.interface';
import { Paginated, RequestParameter } from './data.interface';
import { HttpClient } from './http.service';
import { TrashService } from './trash.service';
import { DataService } from './data.service';
import { mix } from 'ts-mixer';

export interface AssetService extends DataService<Asset>, TrashService<Asset> {}

@mix(DataService, TrashService)
export class AssetService {
  constructor(httpClient: HttpClient) {
    this.setTrashVals(httpClient, '/assets');
    this.init(httpClient, '/assets');
  }

  /*
  public paperBinRestoreAll(): Promise<Asset[]> {
    return this.httpClient.put<Asset[]>(`${this.basePath}/paperbin/restore`, {});
  }

  public paperBinRestoreOne(id: string): Promise<Asset> {
    return this.httpClient.put<Asset>(`${this.basePath}/paperbin/restore/${id}`, {});
  }

  public emptyTrash(offset: number): Promise<{ acknowledged: boolean; deletedCount: number }> {
    return this.httpClient.delete(`${this.basePath}/paperbin/clean`, { params: { offset } });
  }

  public getPaperBin(params: RequestParameter = {}): Promise<Paginated<Asset[]>> {
    params.limit = params.limit || 0;
    params.page = params.page || 1;
    return this.httpClient.get(`${this.basePath}/paperbin`, { params });
  }

   */

  public deleteOne(id: string, force = false): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${id}`, { params: { force } });
  }

  public addAttachment = (id: string, form: FormData): Promise<Asset> => {
    const headers = { ...form.getHeaders() };
    return this.httpClient.post<Asset>(`${this.basePath}/${id}/attachment`, form, {
      headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  };

  public getChildren(assetId: string, params: RequestParameter = {}): Promise<Paginated<Asset[]>> {
    return this.getManyFiltered({ parent: assetId }, params);
  }

  public getRevisions(assetId: string): Promise<Paginated<AssetRevision[]>> {
    return this.httpClient.get<Paginated<AssetRevision[]>>(`${this.basePath}/${assetId}/revisions`);
  }

  public rollback(assetId: string, revisionId: string): Promise<Asset> {
    return this.httpClient.put<Asset>(`${this.basePath}/${assetId}/rollback`, { revisionId });
  }

  public deleteRevision(assetId: string, revisionId: string): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${assetId}/revisions/${revisionId}`);
  }
}
