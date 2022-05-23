import { DataService } from './data.service';
import { FlowDiagram, Flow } from './flow.interface';
import { HttpClient } from './http.service';
import { Paginated, RequestParameter } from './data.interface';
import { FlowDeployment } from './flow-deployment.interface';

export class FlowService extends DataService<Flow> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/flows');
  }

  // workaround as flow-service does not have a POST /many endpoint
  public addMany(dto: any[]): Promise<Flow[]> {
    const reqs = dto.map((v) => this.addOne(v));
    return Promise.all(reqs);
  }

  public getMany(params: RequestParameter = {}): Promise<Paginated<Flow[]>> {
    params.populate = params.populate ? params.populate : 'none';
    return super.getMany(params);
  }

  public getOne(id: string, options: any = {}): Promise<Flow> {
    options.populate = options.populate ? options.populate : 'none';
    return super.getOne(id, options);
  }

  public getFlowWithDiagram(diagramId: string): Promise<Flow> {
    return this.httpClient.get<Flow>(`${this.basePath}/diagram/${diagramId}`);
  }

  public getDiagramRevisions(id: string): Promise<FlowDiagram[]> {
    return this.httpClient.get<FlowDiagram[]>(`${this.basePath}/${id}/revisions`);
  }

  public async isDeploymentOnLatestDiagramVersion(depl: FlowDeployment): Promise<boolean> {
    const flowId = typeof depl.flow === 'string' ? depl.flow : depl.flow.id;
    const diagramId = typeof depl.diagram === 'string' ? depl.diagram : depl.diagram.id;
    const revisions = await this.getDiagramRevisions(flowId);
    return revisions.reverse()[0].id === diagramId;
  }

  public getRevisions(id: string): Promise<Paginated<Flow[]>> {
    return this.httpClient.get<Paginated<Flow[]>>(`${this.basePath}/${id}/revisions`);
  }

  public rollback(id: string, revisionId: string): Promise<Flow> {
    return this.httpClient.put<Flow>(`${this.basePath}/${id}/rollback`, { revisionId });
  }

  public deleteRevision(id: string, revisionId: string): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${id}/revisions/${revisionId}`);
  }

}
