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

  public getAttachments(assetId: string, options: TokenOption = {}): Promise<Paginated<Attachment[]>> {
    return this.httpClient.get<Paginated<Attachment[]>>(`${this.basePath}/${assetId}/attachments`, options);
  }

  public getEventLevelOverride(ids: string[], causes: string[], options: TokenOption = {}): Promise<EventLevelOverride> {
    return this.httpClient.get<EventLevelOverride>(`${this.basePath}/eventcauses`, {
      params: { ids: ids.join(','), causes: causes.join(',') },
      ...options,
    });
  }

  public updateEventCausesAsset(id: string, dto: EventCause, options: TokenOption = {}): Promise<Asset> {
    return this.httpClient.put<Asset>(`${this.basePath}/${id}/eventcauses`, dto, options);
  }

  public getRevisions(assetId: string, options: TokenOption = {}): Promise<Paginated<AssetRevision[]>> {
    return this.httpClient.get<Paginated<AssetRevision[]>>(`${this.basePath}/${assetId}/revisions`, options);
  }

  public rollback(assetId: string, revisionId: string, options: TokenOption = {}): Promise<Asset> {
    return this.httpClient.put<Asset>(`${this.basePath}/${assetId}/rollback`, { revisionId }, options);
  }

  public deleteRevision(assetId: string, revisionId: string, options: TokenOption = {}): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${assetId}/revisions/${revisionId}`, options);
  }
}
