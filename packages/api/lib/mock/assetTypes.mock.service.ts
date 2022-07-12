import { AssetType, AssetTypeRevision } from '../asset.interface';
import { AssetTypesService } from '../assettypes.service';
import { DataMockService } from './data.mock.service';
import { Paginated } from '../data.interface';
import { randomUUID } from 'crypto';

export class AssetTypesMockService extends DataMockService<AssetType> implements AssetTypesService {
  constructor(assetTypes: AssetType[], private revisions: AssetTypeRevision[]) {
    super();
    this.data = assetTypes;
  }

  addOne(dto: AssetType): Promise<AssetType> {
    const id = randomUUID();
    this.revisions.push({ ...dto, id, originalId: dto.id });
    return super.addOne(dto);
  }

  deleteOne(id: string): Promise<any> {
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

  public rollback(_id: string, revisionId: string): Promise<AssetType> {
    const assetType = this.revisions.find((revision) => revision.id === revisionId);
    return Promise.resolve(assetType);
  }

  public deleteRevision(_assetId: string, revisionId: string): Promise<any> {
    const index = this.revisions.findIndex((revision) => revision.id === revisionId);
    this.revisions.splice(index, 1);
    return Promise.resolve(revisionId);
  }
}
