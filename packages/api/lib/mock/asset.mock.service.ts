import FormData from 'form-data';
import { Asset, AssetRevision } from '../asset.interface';
import { Paginated, RequestParameter } from '../data.interface';
import { MockAPI } from './api.mock';
import { DataMockService } from './data.mock.service';
import { mix } from 'ts-mixer';
import { TrashMockService } from './trash.mock.service';
import { HttpClient } from '../http.service';

interface MixedClass extends DataMockService<Asset>, TrashMockService<Asset> {}

@mix(DataMockService, TrashMockService)
class MixedClass {
  constructor(httpClient: HttpClient, basePath) {
  }
}

export class AssetMockService extends MixedClass {
  constructor(private api: MockAPI, assets: Asset[], private revisions: AssetRevision[]) {
    super(null, null);
    this.data = assets;
    this.initTrash(null, null, assets, this.deleteOne);
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
