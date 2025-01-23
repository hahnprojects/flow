import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { DataService } from './data.service';
import { FlowDeployment, FlowDeploymentMetrics, FlowDeploymentStatistic, FlowLog } from './flow-deployment.interface';
import { HttpClient, TokenOption } from './http.service';
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
  public addMany(dto: any[], options: TokenOption = {}): Promise<FlowDeployment[]> {
    const reqs = dto.map((v) => this.addOne(v, options));
    return Promise.all(reqs);
  }

  public updateOne(id: string, dto: any, options: TokenOption & { force: boolean } = { force: false }): Promise<FlowDeployment> {
    return super.updateOne(id, dto, options);
  }

  public getDeploymentStatistics(id: string, options: TokenOption = {}): Promise<FlowDeploymentStatistic> {
    return this.httpClient.get<FlowDeploymentStatistic>(`${this.basePath}/${id}/statistics`, options);
  }

  public getDeploymentMetrics(id: string, range = '12h', interval = '5m', options: TokenOption = {}): Promise<FlowDeploymentMetrics> {
    const params = { range, interval };
    return this.httpClient.get<FlowDeploymentMetrics>(`${this.basePath}/${id}/metrics`, { params, ...options });
  }

  public getDeploymentLogs(id: string, options: TokenOption = {}): Promise<FlowLog[]> {
    return this.httpClient.get<FlowLog[]>(`${this.basePath}/${id}/logs`, options);
  }

  public resolveReferences(id: string, recursive = true, types?: string[], options: TokenOption = {}): Promise<ResourceReference[]> {
    const params = { recursive, types: types?.join(',') ?? undefined };
    return this.httpClient.get(`${this.basePath}/${id}/references`, { params, ...options });
  }

  public updateStatus(
    id: string,
    desiredStatus: 'running' | 'stopped' | 'deleted' | 'paused',
    options: TokenOption = {},
  ): Promise<FlowDeployment> {
    return this.httpClient.put<FlowDeployment>(`${this.basePath}/${id}/status`, { desiredStatus }, options);
  }

  public deleteOne(id: string, _force?: boolean, options: TokenOption = {}): Promise<FlowDeployment> {
    return this.updateStatus(id, 'deleted', options);
  }

  public async waitForRunningStatus(id: string, options: TokenOption = {}) {
    return new Promise<void>(async (resolve, reject) => {
      const esId = await this.subscribeToStatus(
        id,
        (event) => {
          if (
            event.type === 'message' &&
            ['running', 'deployment failed', 'deleted', 'generating failed', 'updating failed', 'upgrading failed'].includes(event.data)
          ) {
            this.httpClient.destroyEventSource(esId);
            if (event.data === 'running') {
              resolve();
            } else {
              reject(`Deployment in failed status: ${event.data}`);
            }
          }
        },
        (event) => reject(event),
        options,
      );
    });
  }

  public addOne(
    dto: {
      diagramId: string;
      name: string;
      properties?: Record<string, any>;
      readPermissions?: string[];
      readWritePermissions?: string[];
      tags?: string[];
    },
    options: TokenOption = {},
  ): Promise<FlowDeployment> {
    return super.addOne(dto, options);
  }

  public subscribeToStatus(
    id: string,
    listener: (event: MessageEvent<any>) => void,
    errorListener?: (event: MessageEvent) => void,
    options: TokenOption = {},
  ) {
    return this.httpClient.addEventSource(`${this.basePath}/${id}/status`, listener, errorListener, options);
  }

  public subscribeToLogs(
    id: string,
    listener: (event: MessageEvent<any>) => void,
    errorListener?: (event: MessageEvent) => void,
    options: TokenOption = {},
  ) {
    return this.httpClient.addEventSource(`${this.basePath}/${id}/logs/subscribe`, listener, errorListener, options);
  }
}
