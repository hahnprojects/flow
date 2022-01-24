import FormData from 'form-data';

import { Asset, AssetRevision } from '../asset.interface';
import { AssetService } from '../asset.service';
import { Paginated, RequestParameter } from '../data.interface';
import { MockAPI } from './api.mock';
import { DataMockService } from './data.mock.service';

export class AssetMockService extends DataMockService<Asset> implements AssetService {
  private revisions: AssetRevision[] = []

  constructor(private api: MockAPI, assets: Asset[], revisions: AssetRevision[]) {
    super();
    this.data = assets;
    this.revisions = revisions;
  }

  async addAttachment(id: string, form: FormData): Promise<Asset> {
    const asset = this.data.find((v) => v.id === id);
    const content = await this.api.contentManager.upload(form);
    asset.attachments.push(content.id);
    return Promise.resolve(asset);
  }

  public getChildren(assetId: string, params: RequestParameter = {}): Promise<Paginated<Asset[]>> {
    return this.getManyFiltered({ parent: assetId }, params);
  }

  public findRevisions(assetId: string): Promise<Paginated<AssetRevision[]>> {
    const newData = this.revisions.filter(revision => revision.originalId === assetId);
    const page: Paginated<AssetRevision[]> = {
      docs: newData,
      limit: Number.MAX_SAFE_INTEGER,
      total: newData.length
    };
    return Promise.resolve(page);
  }
}
