import { DataMockService } from './data.mock.service';
import { Flow, FlowDiagram } from '../flow.interface';
import { FlowService } from '../flow.service';
import { Paginated, RequestParameter } from '../data.interface';

export class FlowMockService extends DataMockService<Flow> implements FlowService {
  constructor(flows: Flow[], private diagrams: FlowDiagram[]) {
    super();
    this.data = flows;
  }

  getFlowWithDiagram(diagramId: string): Promise<Flow> {
    return Promise.resolve(this.data.find((v1) => v1.id === this.diagrams.find((v) => v.id === diagramId).flow));
  }

  async getMany(params?: RequestParameter): Promise<Paginated<Flow[]>> {
    const flows = await super.getMany(params);
    return { docs: flows.docs.map((v) => ({ ...v, diagram: this.diagrams.find((v1) => v1.id === v.diagram)})), total: 0, limit: 0};
  }
}
