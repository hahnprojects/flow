import FormData from 'form-data';
import { Asset, AssetRevision } from './asset.interface';
import { Paginated, RequestParameter } from './data.interface';
import { HttpClient } from './http.service';
import { TrashService } from './trash.service';
import { DataService } from './data.service';
import { mix, settings } from 'ts-mixer';

settings.initFunction = 'init';

export interface AssetService extends DataService<Asset>, TrashService<Asset> {}

@mix(DataService, TrashService)
export class AssetService {
  constructor(httpClient: HttpClient) {}

  init(httpClient: HttpClient) {
    this.initData(httpClient, '/assets');
    this.initTrash(httpClient, '/assets');
  }

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
