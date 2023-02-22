import FormData from 'form-data';
import { mix } from 'ts-mixer';

import { Asset, AssetRevision, Attachment } from '../asset.interface';
import { AssetService } from '../asset.service';
import { Paginated, RequestParameter } from '../data.interface';
import { MockAPI } from './api.mock';
import { APIBaseMock } from './api-base.mock';
import { DataMockService } from './data.mock.service';
import { TrashMockService } from './trash.mock.service';

interface BaseService extends DataMockService<Asset>, TrashMockService<Asset> {}
@mix(DataMockService, TrashMockService)
class BaseService extends APIBaseMock<Asset> {}

export class AssetMockService extends BaseService implements AssetService {
  constructor(private api: MockAPI, assets: Asset[], private revisions: AssetRevision[]) {
    super(assets);
  }

  private getAssets(params: RequestParameter, deleted = false) {
    const data = this.data.filter((asset) => !!asset.deletedAt === deleted);
    const page: Paginated<Asset[]> = {
      docs: data,
      limit: params && params.limit ? params.limit : Number.MAX_SAFE_INTEGER,
      total: data.length,
    };
    return page;
  }

  addOne(dto: Asset): Promise<Asset> {
    this.revisions.push({ ...dto, originalId: dto.id });
    return super.addOne(dto);
  }

  deleteOne(assetId: string, force = false): Promise<Asset> {
    const asset = this.data.find((v) => v.id === assetId);
    if (!asset?.deletedAt && !force) {
      // put asset in paper bin by setting deletedAt prop
      asset.deletedAt = new Date().toISOString();
      return Promise.resolve(asset);
    }
    this.revisions
      .filter((revision) => revision.originalId === assetId)
      .forEach((revision) => {
        const index = this.revisions.indexOf(revision);
        this.revisions.splice(index, 1);
      });
    return super.deleteOne(assetId);
  }

  getMany(params?: RequestParameter): Promise<Paginated<Asset[]>> {
    const page = this.getAssets(params, false);
    return Promise.resolve(page);
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

  public async getAttachments(assetId: string): Promise<Paginated<Attachment[]>> {
    const contents = await this.api.contentManager.getMany();
    const docs = contents.docs.filter((c) => c.assets?.includes?.(assetId));
    return { docs, total: docs.length, limit: 0 };
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
