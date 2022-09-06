import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { Paginated, RequestParameter } from './data.interface';
import { DataService } from './data.service';
import { FlowDiagram, FlowDto } from './flow.interface';
import { FlowDeployment } from './flow-deployment.interface';
import { HttpClient } from './http.service';
import { TrashService } from './trash.service';

interface BaseService extends DataService<FlowDto>, TrashService<FlowDto> {}
@mix(DataService, TrashService)
class BaseService extends APIBase {}

export class FlowService extends BaseService {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/flows');
  }

  // workaround as flow-service does not have a POST /many endpoint
  public addMany(dto: any[]): Promise<FlowDto[]> {
    const reqs = dto.map((v) => this.addOne(v));
    return Promise.all(reqs);
  }

  public getMany(params: RequestParameter = {}): Promise<Paginated<FlowDto[]>> {
    params.populate = params.populate ? params.populate : 'none';
    return super.getMany(params);
  }

  public getOne(id: string, options: any = {}): Promise<FlowDto> {
    options.populate = options.populate ? options.populate : 'none';
    return super.getOne(id, options);
  }

  public getFlowWithDiagram(diagramId: string): Promise<FlowDto> {
    return this.httpClient.get<FlowDto>(`${this.basePath}/diagram/${diagramId}`);
  }

  public getDiagramRevisions(id: string): Promise<FlowDiagram[]> {
    return this.httpClient.get<FlowDiagram[]>(`${this.basePath}/${id}/diagram/revisions`);
  }

  public async isDeploymentOnLatestDiagramVersion(depl: FlowDeployment): Promise<boolean> {
    const flowId = typeof depl.flow === 'string' ? depl.flow : depl.flow.id;
    const diagramId = typeof depl.diagram === 'string' ? depl.diagram : depl.diagram.id;
    const revisions = await this.getDiagramRevisions(flowId);
    return revisions[revisions.length - 1].id === diagramId;
  }

  public getRevisions(id: string): Promise<Paginated<FlowDto[]>> {
    return this.httpClient.get<Paginated<FlowDto[]>>(`${this.basePath}/${id}/revisions`);
  }

  public rollback(id: string, revisionId: string): Promise<FlowDto> {
    return this.httpClient.put<FlowDto>(`${this.basePath}/${id}/rollback`, { revisionId });
  }

  public deleteRevision(id: string, revisionId: string): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${id}/revisions/${revisionId}`);
  }
}
