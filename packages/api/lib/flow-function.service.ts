import { DataService } from './data.service';
import { FlowFunctionDto } from './flow-function.interface';
import { HttpClient, TokenOption } from './http.service';
import { Paginated } from './data.interface';

export class FlowFunctionService extends DataService<FlowFunctionDto> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/flow/functions');
  }

  // workaround as flow-functions-service does not have a POST /many endpoint
  public addMany(dto: any[], options: TokenOption = {}): Promise<FlowFunctionDto[]> {
    const reqs = dto.map((v) => this.addOne(v, options));
    return Promise.all(reqs);
  }

  public getRevisions(fqn: string, options: TokenOption = {}): Promise<Paginated<FlowFunctionDto[]>> {
    return this.httpClient.get<Paginated<FlowFunctionDto[]>>(`${this.basePath}/${fqn}/revisions`, options);
  }

  public rollback(fqn: string, revisionId: string, options: TokenOption = {}): Promise<FlowFunctionDto> {
    return this.httpClient.put<FlowFunctionDto>(`${this.basePath}/${fqn}/rollback`, { revisionId }, options);
  }

  public deleteRevision(fqn: string, revisionId: string, options: TokenOption = {}): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${fqn}/revisions/${revisionId}`, options);
  }
}
