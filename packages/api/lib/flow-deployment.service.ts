import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { DataService } from './data.service';
import { FlowDeployment, FlowDeploymentMetrics, FlowDeploymentStatistic, FlowLog } from './flow-deployment.interface';
import { HttpClient } from './http.service';
import { ResourceReference } from './resource.interface';
import { TrashService } from './trash.service';

interface BaseService extends DataService<FlowDeployment>, TrashService<FlowDeployment> {}
@mix(DataService, TrashService)
class BaseService extends APIBase {}

export class FlowDeploymentService extends BaseService {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/flow/deployments');
  }

  // workaround as flow-deployment-service does not have a POST /many endpoint
  public addMany(dto: any[]): Promise<FlowDeployment[]> {
    const reqs = dto.map((v) => this.addOne(v));
    return Promise.all(reqs);
  }

  public updateOne(id: string, dto: any, force = false): Promise<FlowDeployment> {
    return this.httpClient.put<FlowDeployment>(`${this.basePath}/${id}`, dto, { params: { force } });
  }

  public getDeploymentStatistics(id: string): Promise<FlowDeploymentStatistic> {
    return this.httpClient.get<FlowDeploymentStatistic>(`${this.basePath}/${id}/statistics`);
  }

  public getDeploymentMetrics(id: string, range = '12h', interval = '5m'): Promise<FlowDeploymentMetrics> {
    const params = { range, interval };
    return this.httpClient.get<FlowDeploymentMetrics>(`${this.basePath}/${id}/metrics`, { params });
  }

  public getDeploymentLogs(id: string): Promise<FlowLog[]> {
    return this.httpClient.get<FlowLog[]>(`${this.basePath}/${id}/logs`);
  }

  public resolveReferences(id: string, recursive = true, types?: string[]): Promise<ResourceReference[]> {
    const params = { recursive, types: types?.join(',') ?? undefined };
    return this.httpClient.get(`${this.basePath}/${id}/references`, { params });
  }

  public updateStatus(id: string, desiredStatus: 'running' | 'stopped' | 'deleted' | 'paused'): Promise<FlowDeployment> {
    return this.httpClient.put<FlowDeployment>(`${this.basePath}/${id}/status`, { desiredStatus });
  }

  public deleteOne(id: string): Promise<FlowDeployment> {
    return this.updateStatus(id, 'deleted');
  }

  public async waitForRunningStatus(id: string) {
    return new Promise<void>(async (resolve, reject) => {
      const esId = await this.subscribeToStatus(id, (event) => {
        if (
          event.type === 'message' &&
          ['running', 'deployment failed', 'deleted', 'generating failed', 'updating failed', 'upgrading failed'].includes(event.data)
        ) {
          this.httpClient.destroyEventSource(esId);
          event.data === 'running' ? resolve() : reject(`Deployment in failed status: ${event.data}`);
        }
      });
    });
  }

  public addOne(dto: {
    diagramId: string;
    name: string;
    properties?: Record<string, any>;
    readPermissions?: string[];
    readWritePermissions?: string[];
    tags?: string[];
  }): Promise<FlowDeployment> {
    return super.addOne(dto);
  }

  public subscribeToStatus(id: string, listener: (event: MessageEvent<any>) => void, errorListener?: (event: MessageEvent) => void) {
    return this.httpClient.addEventSource(`${this.basePath}/${id}/status`, listener, errorListener);
  }

  public subscribeToLogs(id: string, listener: (event: MessageEvent<any>) => void, errorListener?: (event: MessageEvent) => void) {
    return this.httpClient.addEventSource(`${this.basePath}/${id}/logs/subscribe`, listener, errorListener);
  }
}
