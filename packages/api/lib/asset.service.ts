import FormData from 'form-data';
import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { Asset, AssetRevision, Attachment, EventCause, EventLevelOverride } from './asset.interface';
import { Paginated, RequestParameter } from './data.interface';
import { DataService } from './data.service';
import { HttpClient, TokenOption } from './http.service';
import { TrashService } from './trash.service';

interface BaseService extends DataService<Asset>, TrashService<Asset> {}
@mix(DataService, TrashService)
class BaseService extends APIBase {}

export class AssetService extends BaseService {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/assets');
  }

  public deleteOne(id: string, force = false, options: TokenOption = {}): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${id}`, { params: { force }, ...options });
  }

  public addAttachment = (id: string, form: FormData, options: TokenOption = {}): Promise<Asset> => {
    const headers = { ...form.getHeaders() };
    return this.httpClient.post<Asset>(`${this.basePath}/${id}/attachment`, form, {
      headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      ...options,
    });
  };

  public getChildren(assetId: string, params: RequestParameter = {}, options: TokenOption = {}): Promise<Paginated<Asset[]>> {
    return this.getManyFiltered({ parent: assetId }, params, options);
  }

  public getAttachments(assetId: string): Promise<Paginated<Attachment[]>> {
    return this.httpClient.get<Paginated<Attachment[]>>(`${this.basePath}/${assetId}/attachments`);
  }

  public getEventLevelOverride(ids: string[], causes: string[]): Promise<EventLevelOverride> {
    return this.httpClient.get<EventLevelOverride>(`${this.basePath}/eventcauses`, {
      params: { ids: ids.join(','), causes: causes.join(',') },
    });
  }

  public updateEventCausesAsset(id: string, dto: EventCause): Promise<Asset> {
    return this.httpClient.put<Asset>(`${this.basePath}/${id}/eventcauses`, dto);
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
