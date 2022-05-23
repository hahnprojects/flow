import { DataService } from './data.service';
import { FlowFunction } from './flow-function.interface';
import { HttpClient } from './http.service';
import { Paginated } from './data.interface';

export class FlowFunctionService extends DataService<FlowFunction> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/flow/functions');
  }

  // workaround as flow-functions-service does not have a POST /many endpoint
  public addMany(dto: any[]): Promise<FlowFunction[]> {
    const reqs = dto.map((v) => this.addOne(v));
    return Promise.all(reqs);
  }

  public getRevisions(fqn: string): Promise<Paginated<FlowFunction[]>> {
    return this.httpClient.get<Paginated<FlowFunction[]>>(`${this.basePath}/${fqn}/revisions`);
  }

  public rollback(fqn: string, revisionId: string): Promise<FlowFunction> {
    return this.httpClient.put<FlowFunction>(`${this.basePath}/${fqn}/rollback`, { revisionId });
  }

  public deleteRevision(fqn: string, revisionId: string): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${fqn}/revisions/${revisionId}`);
  }
}
