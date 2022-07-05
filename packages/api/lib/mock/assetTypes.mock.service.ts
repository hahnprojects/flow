import { AssetType, AssetTypeRevision } from '../asset.interface';
import { DataMockService } from './data.mock.service';
import { Paginated, RequestParameter } from '../data.interface';
import { randomUUID } from 'crypto';
import { TrashMockService } from './trash.mock.service';
import { mix } from 'ts-mixer';

interface MixedClass extends DataMockService<AssetType>, TrashMockService<AssetType> {}

@mix(DataMockService, TrashMockService)
class MixedClass {}

export class AssetTypesMockService extends MixedClass {
  constructor(assetTypes: AssetType[], private revisions: AssetTypeRevision[]) {
    super();
    this.data = assetTypes;
    this.initMock(assetTypes, revisions);
  }

  public initMock(assetTypes: AssetType[], revisions: AssetTypeRevision[]) {
    this.data = assetTypes;
    this.initData(null, null);
    this.initTrash(null, null, assetTypes, this.deleteOne);
  }

  getMany(params?: RequestParameter): Promise<Paginated<AssetType[]>> {
    const page = this.getItems(params, false);
    return Promise.resolve(page);
  }

  addOne(dto: AssetType): Promise<AssetType> {
    const id = randomUUID();
    this.revisions.push({ ...dto, id, originalId: dto.id });
    return super.addOne(dto);
  }

  deleteOne(id: string, force = false): Promise<any> {
    const assettype = this.data.find((v) => v.id === id);
    if (!assettype?.deletedAt && !force) {
      // put asset in paper bin by setting deletedAt prop
      assettype.deletedAt = new Date().toISOString();
      return Promise.resolve(assettype);
    }
    this.revisions
      .filter((revision) => revision.originalId === id)
      .forEach((revision) => {
        const index = this.revisions.indexOf(revision);
        this.revisions.splice(index, 1);
      });
    return super.deleteOne(id);
  }

  async updateOne(id: string, dto: AssetType): Promise<AssetType> {
    await super.deleteOne(id);
    const assetType = await this.addOne(dto);
    return Promise.resolve(assetType);
  }

  public getRevisions(id: string): Promise<Paginated<AssetTypeRevision[]>> {
    const revisions = this.revisions.filter((revision) => revision.originalId === id);
    const page: Paginated<AssetTypeRevision[]> = {
      docs: revisions,
      limit: Number.MAX_SAFE_INTEGER,
      total: revisions.length,
    };
    return Promise.resolve(page);
  }

  public rollback(id: string, revisionId: string): Promise<AssetType> {
    const assetType = this.revisions.find((revision) => revision.id === revisionId);
    return Promise.resolve(assetType);
  }

  public deleteRevision(assetId: string, revisionId: string): Promise<any> {
    const index = this.revisions.findIndex((revision) => revision.id === revisionId);
    this.revisions.splice(index, 1);
    return Promise.resolve(revisionId);
  }
}
