import { DataMockService } from './data.mock.service';
import { FlowFunctionDto, FlowFunctionRevision } from '../flow-function.interface';
import { FlowFunctionService } from '../flow-function.service';
import { Paginated } from '../data.interface';
import { randomUUID } from 'crypto';

export class FlowFunctionsMockService extends DataMockService<FlowFunctionDto> implements FlowFunctionService {
  constructor(functions: FlowFunctionDto[], private revisions: FlowFunctionRevision[]) {
    super();
    this.data = functions;
  }

  addOne(dto: FlowFunctionDto): Promise<FlowFunctionDto> {
    const id = randomUUID();
    this.revisions.push({ ...dto, id, originalId: dto.fqn });
    return super.addOne(dto);
  }

  deleteOne(fqn: string): Promise<any> {
    const index = this.data.findIndex((v) => v.fqn === fqn);
    this.data.splice(index, 1);
    this.revisions
      .filter((revision) => revision.originalId === fqn)
      .forEach((revision) => {
        const index1 = this.revisions.indexOf(revision);
        this.revisions.splice(index1, 1);
      });
    return Promise.resolve(undefined);
  }

  async updateOne(fqn: string, dto: FlowFunctionDto): Promise<FlowFunctionDto> {
    const index = this.data.findIndex((v) => v.fqn === fqn);
    this.data.splice(index, 1);
    const flowFunction = await this.addOne(dto);
    return Promise.resolve(flowFunction);
  }

  getOne(fqn: string, _options?: any): Promise<FlowFunctionDto> {
    const t = this.data.find((v: any) => v.fqn === fqn);
    return Promise.resolve(t);
  }

  private async getOneById(id: string) {
    return this.data.find((v: any) => v.id === id);
  }

  public getRevisions(fqn: string): Promise<Paginated<FlowFunctionRevision[]>> {
    const revisions = this.revisions.filter((revision) => revision.originalId === fqn);
    const page: Paginated<FlowFunctionRevision[]> = {
      docs: revisions,
      limit: Number.MAX_SAFE_INTEGER,
      total: revisions.length,
    };
    return Promise.resolve(page);
  }

  public rollback(_fqn: string, revisionId: string): Promise<FlowFunctionDto> {
    const assetType = this.revisions.find((revision) => revision.id === revisionId);
    return Promise.resolve(assetType);
  }

  public deleteRevision(_fqn: string, revisionId: string): Promise<any> {
    const index = this.revisions.findIndex((revision) => revision.id === revisionId);
    this.revisions.splice(index, 1);
    return Promise.resolve(revisionId);
  }
}
