import { DataMockService } from './data.mock.service';
import { FlowModule } from '../flow-module.interface';
import { FlowModuleService } from '../flow-module.service';
import { Artifact } from '../storage.interface';
import { Replace } from './api.mock';
import FormData from 'form-data';

type ExtendedFlowModule = Replace<FlowModule, 'artifacts', Array<Artifact & { path: string }>>;

export class FlowModulesMockService extends DataMockService<ExtendedFlowModule> implements FlowModuleService {
  constructor(modules: ExtendedFlowModule[]) {
    super();
    this.data = modules;
  }

  async deleteArtifact(name: string, version: string): Promise<FlowModule> {
    const module = await this.getOne(name);
    const index = module.artifacts.findIndex((art) => art.version === version);
    module.artifacts.splice(index, 1);
    return Promise.resolve(module);
  }

  publish(_form: FormData): Promise<unknown> {
    return Promise.resolve(undefined);
  }

  getOne(name: string, _options: any = {}): Promise<ExtendedFlowModule> {
    const t = this.data.find((v: any) => v.name === name);
    return Promise.resolve(t);
  }
}
