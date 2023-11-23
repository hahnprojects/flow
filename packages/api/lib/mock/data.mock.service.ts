import { Filter, instanceOfTimePeriod, Paginated, RequestParameter } from '../data.interface';
import { DataService } from '../data.service';
import { APIBaseMock } from './api-base.mock';

export class DataMockService<T> extends DataService<T> implements APIBaseMock<T> {
  data: T[] = [];

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
    const obj = this.data[index];
    this.data.splice(index, 1);
    return Promise.resolve(obj);
  }

  getMany(params?: RequestParameter): Promise<Paginated<T[]>> {
    const data = this.data;
    const page: Paginated<T[]> = {
      docs: data,
      limit: params && params.limit ? params.limit : Number.MAX_SAFE_INTEGER,
      total: data.length,
    };
    return Promise.resolve(page);
  }

  async getManyFiltered(filter: Filter, params: RequestParameter = {}): Promise<Paginated<T[]>> {
    const paginated = await this.getMany(params);
    const newData = paginated.docs.filter((doc: any) =>
      Object.entries(filter).every(([filterKey, filterValue]): boolean => {
        const docValue = doc[filterKey];
        if (!docValue) {
          return false;
        } else if (instanceOfTimePeriod(filterValue) && docValue[filterKey]) {
          const date = new Date(docValue[filterKey]);
          return date >= filterValue.from && date <= filterValue.to;
        } else if (Array.isArray(filterValue)) {
          return filterValue.includes(docValue);
        } else {
          return docValue === filterValue;
        }
      }),
    );
    const page: Paginated<T[]> = {
      docs: newData,
      limit: paginated.limit || Number.MAX_SAFE_INTEGER,
      total: newData.length,
    };
    return Promise.resolve(page);
  }

  getOne(id: string, options: Record<string, any> & { idKey?: string } = {}): Promise<T> {
    const idKey = options.idKey || 'id';
    const t = this.data.find((v: any) => v[idKey] === id);
    return Promise.resolve(t);
  }

  async updateOne(id: string, dto: any): Promise<T> {
    await this.deleteOne(id);
    const t = await this.addOne(dto);
    return Promise.resolve(t);
  }
}
