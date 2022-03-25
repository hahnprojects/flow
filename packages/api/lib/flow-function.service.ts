import { DataService } from './data.service';
import { FlowFunctionDto } from './flow-function.interface';
import { HttpClient } from './http.service';

export class FlowFunctionService extends DataService<FlowFunctionDto> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/flow/functions');
  }

  // workaround as flow-functions-service does not have a POST /many endpoint
  public addMany(dto: any[]): Promise<FlowFunctionDto[]> {
    const reqs = dto.map((v) => this.addOne(v));
    return Promise.all(reqs);
  }

  public getOneWithHistory(fqn: string) {
    return this.httpClient.get<FlowFunctionDto>(`${this.basePath}/${fqn}/history`);
  }

  public rollback(fqn: string, historyId: string) {
    return this.httpClient.put<FlowFunctionDto>(`${this.basePath}/${fqn}/rollback/${historyId}`, {});
  }
}
