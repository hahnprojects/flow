import FormData from 'form-data';

import { Asset } from './asset.interface';
import { Paginated, RequestParameter } from './data.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';

export class AssetService extends DataService<Asset> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/assets');
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

  public findRevisions(assetId: string): Promise<Paginated<Asset>> {
    return this.httpClient.get<Paginated<Asset>>(`${this.basePath}/${assetId}/revisions`);
  }
}
