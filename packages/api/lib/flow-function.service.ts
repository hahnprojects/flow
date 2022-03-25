import { DataService } from './data.service';
import { FlowFunction } from './flow-function.interface';
import { HttpClient } from './http.service';

export class FlowFunctionService extends DataService<FlowFunction> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/flow/functions');
  }

  // workaround as flow-functions-service does not have a POST /many endpoint
  public addMany(dto: any[]): Promise<FlowFunction[]> {
    const reqs = dto.map((v) => this.addOne(v));
    return Promise.all(reqs);
  }

  public getOneWithHistory(fqn: string) {
    return this.httpClient.get<FlowFunction>(`${this.basePath}/${fqn}/history`);
  }

  public rollback(fqn: string, historyId: string) {
    return this.httpClient.put<FlowFunction>(`${this.basePath}/${fqn}/rollback/${historyId}`, {});
  }
}
