import { DataMockService } from './data.mock.service';
import { FlowFunction } from '../flow-function.interface';
import { FlowFunctionService } from '../flow-function.service';
import { randomUUID } from 'crypto';

export class FlowFunctionsMockService extends DataMockService<FlowFunction> implements FlowFunctionService {
  constructor(functions: FlowFunction[], private history: Map<string, Array<FlowFunction & { id: string }>>) {
    super();
    this.data = functions;
  }

  async getOneWithHistory(fqn: string): Promise<FlowFunction> {
    const func = await this.getOne(fqn);
    return Promise.resolve({
      ...func,
      history: await Promise.all(
        func.history.map(async (v) => {
          const func1 = (await this.getOneById(v)) as FlowFunction & { id: string };
          return { author: func1.author, createdAt: '', id: func1.id };
        }),
      ),
    });
  }

  rollback(fqn: string, historyId: string): Promise<FlowFunction> {
    const hist = this.history.get(fqn).find((v: FlowFunction & { id: string }) => v.id === historyId);
    const index = this.data.findIndex((v) => v.fqn === fqn);
    hist.current = hist.id;
    this.data[index] = hist;
    return Promise.resolve(hist);
  }

  getOne(fqn: string, options?: any): Promise<FlowFunction> {
    const t = this.data.find((v: any) => v.fqn === fqn);
    return Promise.resolve(t);
  }

  private async getOneById(id: string) {
    return this.data.find((v: any) => v.id === id);
  }

  async updateOne(fqn: string, dto: FlowFunction): Promise<FlowFunction> {
    const id = randomUUID();
    const exDto = { ...dto, id, current: id };
    (exDto.history as string[]).push(id);
    this.history.get(fqn).push(exDto);

    return exDto;
  }
}
