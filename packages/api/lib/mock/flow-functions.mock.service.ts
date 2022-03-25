import { DataMockService } from './data.mock.service';
import { FlowFunctionDto } from '../flow-function.interface';
import { FlowFunctionService } from '../flow-function.service';
import { randomUUID } from 'crypto';

export class FlowFunctionsMockService extends DataMockService<FlowFunctionDto> implements FlowFunctionService {
  constructor(functions: FlowFunctionDto[], private history: Map<string, Array<FlowFunctionDto & { id: string }>>) {
    super();
    this.data = functions;
  }

  async getOneWithHistory(fqn: string): Promise<FlowFunctionDto> {
    const func = await this.getOne(fqn);
    return Promise.resolve({
      ...func,
      history: await Promise.all(
        func.history.map(async (v) => {
          const func1 = (await this.getOneById(v)) as FlowFunctionDto & { id: string };
          return { author: func1.author, createdAt: '', id: func1.id };
        }),
      ),
    });
  }

  rollback(fqn: string, historyId: string): Promise<FlowFunctionDto> {
    const hist = this.history.get(fqn).find((v: FlowFunctionDto & { id: string }) => v.id === historyId);
    const index = this.data.findIndex((v) => v.fqn === fqn);
    hist.current = hist.id;
    this.data[index] = hist;
    return Promise.resolve(hist);
  }

  getOne(fqn: string, options?: any): Promise<FlowFunctionDto> {
    const t = this.data.find((v: any) => v.fqn === fqn);
    return Promise.resolve(t);
  }

  private async getOneById(id: string) {
    return this.data.find((v: any) => v.id === id);
  }

  async updateOne(fqn: string, dto: FlowFunctionDto): Promise<FlowFunctionDto> {
    const id = randomUUID();
    const exDto = { ...dto, id, current: id };
    (exDto.history as string[]).push(id);
    this.history.get(fqn).push(exDto);

    return exDto;
  }
}
