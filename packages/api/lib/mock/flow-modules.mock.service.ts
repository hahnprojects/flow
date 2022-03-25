import { DataMockService } from './data.mock.service';
import { FlowModule } from '../flow-module.interface';
import { FlowModuleService } from '../flow-module.service';
import { ReadStream } from 'fs';

export class FlowModulesMockService extends DataMockService<FlowModule> implements FlowModuleService {
  constructor(modules: FlowModule[]) {
    super();
    this.data = modules;
  }

  deleteArtifact(name: string, version: string): Promise<FlowModule> {
    return Promise.resolve(undefined);
  }

  download(name: string, version: string, filePath: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  publish(file: ReadStream): Promise<unknown> {
    return Promise.resolve(undefined);
  }
}
