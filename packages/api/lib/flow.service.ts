import { DataService } from './data.service';
import { FlowDto } from './flow.interface';
import { HttpClient } from './http.service';
import { Paginated, RequestParameter } from './data.interface';

export class FlowService extends DataService<FlowDto> {
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
}
