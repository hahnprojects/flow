import { Filter, Paginated, RequestParameter } from '../data.interface';
import { DataService } from '../data.service';

export class DataMockService<T> extends DataService<T> {
  protected data: T[] = [];

  constructor() {
    super(null, null);
  }

  async addMany(dto: any[]): Promise<T[]> {
    const map = dto.map((v) => this.addOne(v));
    return Promise.all(map);
  }

  addOne(dto: any): Promise<T> {
    this.data.push(dto as T);
    return Promise.resolve(dto as T);
  }

  deleteOne(id: string): Promise<any> {
    const index = this.data.findIndex((v: any) => v.id === id);
    this.data.splice(index, 1);
    return Promise.resolve(undefined);
  }

  getMany(params?: RequestParameter): Promise<Paginated<T[]>> {
    let data = this.data;
    const page: Paginated<T[]> = {
      docs: data,
      limit: params && params.limit ? params.limit : Number.MAX_SAFE_INTEGER,
      total: data.length,
    };
    return Promise.resolve(page);
  }

  async getManyFiltered(filter: Filter, params: RequestParameter = {}): Promise<Paginated<T[]>> {
    const paginated = await this.getMany(params);
    const newData = paginated.docs.filter(
      (v: any) => filter.parent === v.parent || filter.tags?.some((tag) => v.tags?.contains(tag)) || filter.type === v.tag,
    );
    const page: Paginated<T[]> = {
      docs: newData,
      limit: paginated.limit || Number.MAX_SAFE_INTEGER,
      total: newData.length,
    };
    return Promise.resolve(page);
  }

  getOne(id: string, options?: any): Promise<T> {
    const t = this.data.find((v: any) => v.id === id);
    return Promise.resolve(t);
  }

  async updateOne(id: string, dto: any): Promise<T> {
    await this.deleteOne(id);
    const t = await this.addOne(dto);
    return Promise.resolve(t);
  }
}
