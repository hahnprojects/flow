import { DataMockService } from './data.mock.service';
import { FlowDiagram, FlowDto } from '../flow.interface';
import { FlowService } from '../flow.service';
import { Paginated, RequestParameter } from '../data.interface';
import { FlowDeployment } from '../flow-deployment.interface';

export class FlowMockService extends DataMockService<FlowDto> implements FlowService {
  constructor(flows: FlowDto[], private diagrams: FlowDiagram[]) {
    super();
    this.data = flows;
  }

  public async isDeploymentOnLatestDiagramVersion(depl: FlowDeployment): Promise<boolean> {
    const flowId = typeof depl.flow === 'string' ? depl.flow : depl.flow.id;
    const diagramId = typeof depl.diagram === 'string' ? depl.diagram : depl.diagram.id;
    const revisions = await this.getRevisions(flowId);
    return revisions.reverse()[0].id === diagramId;
  }

  public getRevisions(id: string): Promise<FlowDiagram[]> {
    return Promise.resolve(this.diagrams.filter((v) => v.flow === id));
  }

  getFlowWithDiagram(diagramId: string): Promise<FlowDto> {
    return Promise.resolve(this.data.find((v1) => v1.id === this.diagrams.find((v) => v.id === diagramId).flow));
  }

  async getMany(params?: RequestParameter): Promise<Paginated<FlowDto[]>> {
    const flows = await super.getMany(params);
    return {
      docs: flows.docs.map((v) => ({ ...v, diagram: this.diagrams.find((v1) => v1.id === v.diagram) })),
      total: 0,
      limit: 0,
    };
  }
}
