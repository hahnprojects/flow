import { DataService } from './data.service';
import { Flow } from './flow.interface';
import { HttpClient } from './http.service';
import { Paginated, RequestParameter } from './data.interface';

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
}
