import FormData from 'form-data';

import { Asset } from '../asset.interface';
import { AssetService } from '../asset.service';
import { Paginated, RequestParameter } from '../data.interface';
import { MockAPI } from './api.mock';
import { DataMockService } from './data.mock.service';

export class AssetMockService extends DataMockService<Asset> implements AssetService {
  constructor(private api: MockAPI, assets: Asset[]) {
    super();
    this.data = assets;
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
}
