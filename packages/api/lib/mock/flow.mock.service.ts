import { DataMockService } from './data.mock.service';
import { FlowDiagram, FlowDto } from '../flow.interface';
import { FlowService } from '../flow.service';
import { Paginated, RequestParameter } from '../data.interface';

export class FlowMockService extends DataMockService<FlowDto> implements FlowService {
  constructor(flows: FlowDto[], private diagrams: FlowDiagram[]) {
    super();
    this.data = flows;
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
