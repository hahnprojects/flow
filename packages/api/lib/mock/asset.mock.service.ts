import FormData from 'form-data';

import { Asset, AssetRevision } from '../asset.interface';
import { AssetService } from '../asset.service';
import { Paginated, RequestParameter } from '../data.interface';
import { MockAPI } from './api.mock';
import { DataMockService } from './data.mock.service';
import { randomUUID } from 'crypto';

export class AssetMockService extends DataMockService<Asset> implements AssetService {
  constructor(private api: MockAPI, assets: Asset[], private revisions: AssetRevision[]) {
    super();
    this.data = assets;
  }

  addOne(dto: Asset): Promise<Asset> {
    const id = randomUUID();
    this.revisions.push({ ...dto, originalId: dto.id });
    return super.addOne(dto);
  }

  deleteOne(assetId: string): Promise<any> {
    this.revisions
      .filter((revision) => revision.originalId === assetId)
      .forEach((revision) => {
        const index = this.revisions.indexOf(revision);
        this.revisions.splice(index, 1);
      });
    return super.deleteOne(assetId);
  }

  async updateOne(assetId: string, dto: Asset): Promise<Asset> {
    await super.deleteOne(assetId);
    const asset = await this.addOne(dto);
    return Promise.resolve(asset);
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

  public getRevisions(assetId: string): Promise<Paginated<AssetRevision[]>> {
    const revisions = this.revisions.filter((revision) => revision.originalId === assetId);
    const page: Paginated<AssetRevision[]> = {
      docs: revisions,
      limit: Number.MAX_SAFE_INTEGER,
      total: revisions.length,
    };
    return Promise.resolve(page);
  }

  public rollback(assetId: string, revisionId: string): Promise<Asset> {
    const asset = this.revisions.find((revision) => revision.id === revisionId);
    return Promise.resolve(asset);
  }

  public deleteRevision(assetId: string, revisionId: string): Promise<any> {
    const index = this.revisions.findIndex((revision) => revision.id === revisionId);
    this.revisions.splice(index, 1);
    return Promise.resolve(revisionId);
  }
}
