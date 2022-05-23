import { DataMockService } from './data.mock.service';
import { FlowDiagram, Flow, FlowRevision } from '../flow.interface';
import { FlowService } from '../flow.service';
import { Paginated, RequestParameter } from '../data.interface';
import { FlowDeployment } from '../flow-deployment.interface';
import { randomUUID } from 'crypto';

export class FlowMockService extends DataMockService<Flow> implements FlowService {
  constructor(flows: Flow[], private diagrams: FlowDiagram[], private revisions: FlowRevision[]) {
    super();
    this.data = flows;
  }

  addOne(dto: Flow): Promise<Flow> {
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

  async updateOne(id: string, dto: Flow): Promise<Flow> {
    await super.deleteOne(id);
    const flow = await this.addOne(dto);
    return Promise.resolve(flow);
  }

  public async isDeploymentOnLatestDiagramVersion(depl: FlowDeployment): Promise<boolean> {
    const flowId = typeof depl.flow === 'string' ? depl.flow : depl.flow.id;
    const diagramId = typeof depl.diagram === 'string' ? depl.diagram : depl.diagram.id;
    const revisions = await this.getDiagramRevisions(flowId);
    return revisions.reverse()[0].id === diagramId;
  }

  public getDiagramRevisions(id: string): Promise<FlowDiagram[]> {
    return Promise.resolve(this.diagrams.filter((v) => v.flow === id));
  }

  getFlowWithDiagram(diagramId: string): Promise<Flow> {
    return Promise.resolve(this.data.find((v1) => v1.id === this.diagrams.find((v) => v.id === diagramId).flow));
  }

  async getMany(params?: RequestParameter): Promise<Paginated<Flow[]>> {
    const flows = await super.getMany(params);
    return {
      docs: flows.docs.map((v) => ({ ...v, diagram: this.diagrams.find((v1) => v1.id === v.diagram) })),
      total: 0,
      limit: 0,
    };
  }

  public getRevisions(id: string): Promise<Paginated<FlowRevision[]>> {
    const revisions = this.revisions.filter((revision) => revision.originalId === id);
    const page: Paginated<FlowRevision[]> = {
      docs: revisions,
      limit: Number.MAX_SAFE_INTEGER,
      total: revisions.length,
    };
    return Promise.resolve(page);
  }

  public rollback(id: string, revisionId: string): Promise<Flow> {
    const flow = this.revisions.find((revision) => revision.id === revisionId);
    return Promise.resolve(flow);
  }

  public deleteRevision(id: string, revisionId: string): Promise<any> {
    const index = this.revisions.findIndex((revision) => revision.id === revisionId);
    this.revisions.splice(index, 1);
    return Promise.resolve(revisionId);
  }
}
