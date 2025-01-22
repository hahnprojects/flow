import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { Paginated, RequestParameter } from './data.interface';
import { DataService } from './data.service';
import { FlowDiagram, FlowDto } from './flow.interface';
import { FlowDeployment } from './flow-deployment.interface';
import { HttpClient, TokenOption } from './http.service';
import { TrashService } from './trash.service';

interface BaseService extends DataService<FlowDto>, TrashService<FlowDto> {}
@mix(DataService, TrashService)
class BaseService extends APIBase {}

export class FlowService extends BaseService {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/flows');
  }

  // workaround as flow-service does not have a POST /many endpoint
  public addMany(dto: any[], options: TokenOption = {}): Promise<FlowDto[]> {
    const reqs = dto.map((v) => this.addOne(v, options));
    return Promise.all(reqs);
  }

  public getMany(params: RequestParameter = {}, options: TokenOption = {}): Promise<Paginated<FlowDto[]>> {
    params.populate = params.populate ? params.populate : 'none';
    return super.getMany(params, options);
  }

  public getOne(id: string, options: TokenOption & { [key: string]: any } = {}): Promise<FlowDto> {
    options.populate = options.populate ? options.populate : 'none';
    return super.getOne(id, options);
  }

  public getFlowWithDiagram(diagramId: string, options: TokenOption = {}): Promise<FlowDto> {
    return this.httpClient.get<FlowDto>(`${this.basePath}/diagram/${diagramId}`, options);
  }

  public getDiagramRevisions(id: string, options: TokenOption = {}): Promise<FlowDiagram[]> {
    return this.httpClient.get<FlowDiagram[]>(`${this.basePath}/${id}/diagram/revisions`, options);
  }

  public async isDeploymentOnLatestDiagramVersion(depl: FlowDeployment, options: TokenOption = {}): Promise<boolean> {
    const flowId = typeof depl.flow === 'string' ? depl.flow : depl.flow.id;
    const diagramId = typeof depl.diagram === 'string' ? depl.diagram : depl.diagram.id;
    const revisions = await this.getDiagramRevisions(flowId, options);
    return revisions[revisions.length - 1].id === diagramId;
  }

  public getRevisions(id: string, options: TokenOption = {}): Promise<Paginated<FlowDto[]>> {
    return this.httpClient.get<Paginated<FlowDto[]>>(`${this.basePath}/${id}/revisions`, options);
  }

  public rollback(id: string, revisionId: string, options: TokenOption = {}): Promise<FlowDto> {
    return this.httpClient.put<FlowDto>(`${this.basePath}/${id}/rollback`, { revisionId }, options);
  }

  public deleteRevision(id: string, revisionId: string, options: TokenOption = {}): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${id}/revisions/${revisionId}`, options);
  }
}
