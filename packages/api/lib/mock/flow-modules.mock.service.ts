import { DataMockService } from './data.mock.service';
import { FlowModule } from '../flow-module.interface';
import { FlowModuleService } from '../flow-module.service';
import { createReadStream, createWriteStream, ReadStream } from 'fs';
import { Artifact } from '../storage.interface';
import { Replace } from './api.mock';
import { finished } from 'stream/promises';

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

  async download(name: string, filePath: string, version = 'latest'): Promise<void> {
    const module = await this.getOne(name);
    const reader = createReadStream(module.artifacts.find((art) => art.version === version)?.path ?? module.artifacts[0].path);
    const writer = createWriteStream(filePath);
    reader.pipe(writer);
    return finished(writer);
  }

  publish(file: ReadStream): Promise<unknown> {
    return Promise.resolve(undefined);
  }

  getOne(name: string, options: any = {}): Promise<ExtendedFlowModule> {
    const t = this.data.find((v: any) => v.name === name);
    return Promise.resolve(t);
  }
}
