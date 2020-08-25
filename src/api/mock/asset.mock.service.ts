import FormData from 'form-data';
import { Asset, AssetInterface } from '../asset.interface';
import { MockAPI } from './api.mock';
import { DataMockService } from './data.mock.service';

export class AssetMockService extends DataMockService<Asset> implements AssetInterface {
  private api: MockAPI;

  constructor(api: MockAPI, assets: Asset[]) {
    super();
    this.api = api;
    this.data = assets
  }

  async addAttachment(id: string, form: FormData): Promise<Asset> {
    const asset = this.data.find(v => v.id === id);
    const content = await this.api.contentManager.upload(form);
    asset.attachments.push(content.id);
    return Promise.resolve(asset);
  }

}