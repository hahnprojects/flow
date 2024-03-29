import { randomUUID } from 'crypto';
import { mix } from 'ts-mixer';

import { FlowDeploymentService } from '../flow-deployment.service';
import { FlowDeployment, FlowDeploymentMetrics, FlowDeploymentStatistic, FlowLog } from '../flow-deployment.interface';
import { ResourceReference } from '../resource.interface';
import { MockAPI } from './api.mock';
import { APIBaseMock } from './api-base.mock';
import { DataMockService } from './data.mock.service';
import { TrashMockService } from './trash.mock.service';

interface BaseService extends DataMockService<FlowDeployment>, TrashMockService<FlowDeployment> {}
@mix(DataMockService, TrashMockService)
class BaseService extends APIBaseMock<FlowDeployment> {}

export class FlowDeploymentMockService extends BaseService implements FlowDeploymentService {
  constructor(
    deployments: FlowDeployment[],
    private api: MockAPI,
  ) {
    super(deployments);
  }

  public subscribeToStatus(
    id: string,
    listener: (event: MessageEvent<any>) => void,
    errorListener?: (event: MessageEvent<any>) => void,
  ): Promise<string> {
    listener(new MessageEvent('message', { data: 'running' }));
    return Promise.resolve(randomUUID());
  }

  public subscribeToLogs(
    id: string,
    listener: (event: MessageEvent<any>) => void,
    errorListener?: (event: MessageEvent) => void,
  ): Promise<string> {
    listener(new MessageEvent('message', { data: 'foo' }));
    return Promise.resolve(randomUUID());
  }

  public async waitForRunningStatus(id: string): Promise<void> {
    const flowDeployment = this.data.find((v) => v.id === id);
    flowDeployment.actualStatus = 'running';
  }

  public async updateStatus(id: string, desiredStatus: 'running' | 'stopped' | 'deleted' | 'paused'): Promise<FlowDeployment> {
    const deployment = await this.getOne(id);
    deployment.desiredStatus = desiredStatus;
    deployment.actualStatus = desiredStatus;
    return Promise.resolve(deployment);
  }

  public async resolveReferences(id: string, recursive?: boolean, types?: string[]): Promise<ResourceReference[]> {
    const depl = await this.getOne(id);
    return depl.refs ?? [];
  }

  public getDeploymentStatistics(id: string): Promise<FlowDeploymentStatistic> {
    return Promise.resolve({
      totalErrorCount: 0,
      errorCountWeek: 0,
      eventCountWeek: 0,
      errorCounts: [],
      metrics: {
        cpu: 0,
        memory: 97931264,
        ctime: 16770,
        elapsed: 172850950,
        timestamp: 1648199692625,
        deploymentId: id,
      },
    });
  }

  public getDeploymentMetrics(id: string, range?: string, interval?: string): Promise<FlowDeploymentMetrics> {
    return Promise.resolve({
      metrics: [{ timestamp: Date.now(), cpu: 0, memory: Math.random() * 1000000 }],
      stats: {
        cpu: { count: 123, avg: 0, max: 0, min: 0, sum: 0 },
        memory: { count: 123, avg: 0, max: 0, min: 0, sum: 0 },
      },
    });
  }

  public async getDeploymentLogs(id: string): Promise<FlowLog[]> {
    const depl = await this.getOne(id);
    return Promise.resolve([
      {
        type: 'flow.log.info',
        deploymentId: id,
        subject: 'FlowApplication',
        data: 'Flow Deployment is running',
        '@timestamp': '2022-03-23T09:14:03.129Z',
        eventId: 'c68b7674-b8da-46c5-85f0-8e4279d74a78',
        datacontenttype: 'text/plain',
        elementId: 'none',
        time: '2022-03-23T09:14:03.129Z',
        flowId: depl.flow as string,
      },
    ]);
  }

  public async addOne(dto: {
    diagramId: string;
    name: string;
    properties?: Record<string, any>;
    readPermissions?: string[];
    readWritePermissions?: string[];
    tags?: string[];
  }): Promise<FlowDeployment> {
    const flow = await this.api.flows.getFlowWithDiagram(dto.diagramId);

    const refs = await this.getReferences(dto.properties);
    const id = randomUUID();
    const newDepl: FlowDeployment = {
      actualStatus: 'generating queued',
      artifact: undefined,
      desiredStatus: 'running',
      diagram: dto.diagramId,
      flow: flow.id,
      flowModel: { elements: [], connections: [], properties: dto.properties },
      id,
      name: dto.name,
      readPermissions: [],
      readWritePermissions: [],
      target: 'executor',
      refs,
    };
    await this.api.flows.updateOne(flow.id, { ...flow, deployments: [...flow.deployments, id] });
    return super.addOne(newDepl);
  }

  public async deleteOne(id: string): Promise<FlowDeployment> {
    const depl = await this.getOne(id);
    const flow = await this.api.flows.getOne(depl.flow as string);
    const index = (flow.deployments as string[]).findIndex((v) => v === id);
    flow.deployments.splice(index, 1);
    await this.api.flows.updateOne(flow.id, flow);
    return super.deleteOne(id);
  }

  private async getReferences(properties: Record<string, any>): Promise<ResourceReference[]> {
    // super simplified version of real resolver
    return Promise.all(
      Object.keys(properties).map(async (prop) => {
        if (prop !== 'assetId') throw new Error('not implemented');
        return { id: (await this.api.assets.getOne(properties[prop])).id, resourceType: 'asset' };
      }),
    );
  }
}
