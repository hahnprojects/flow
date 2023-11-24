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
    if (params?.sort) {
      this.sortData(data, params.sort);
    }
    const page: Paginated<T[]> = {
      docs: data,
      limit: params?.limit ?? Number.MAX_SAFE_INTEGER,
      total: data.length,
    };
    return Promise.resolve(page);
  }

  /**
   * Filters the elements by the passed properties. The object with these properties has to be of the form:
   * {
   *   propertyName: string | string[] | { from: Date, to: Date },
   *   ...
   * }.
   * @param filter The Object with the properties to filter by.
   * @param params Other request parameters.
   */
  async getManyFiltered(filter: Filter, params: RequestParameter = {}): Promise<Paginated<T[]>> {
    const paginated = await this.getMany(params);
    const newData = paginated.docs.filter((doc: any) =>
      Object.entries(filter).every(([filterKey, filterValue]): boolean => {
        const docValue = doc[filterKey];

        if (!docValue) {
          return false;
        }

        return (
          (typeof docValue === 'object' && (filterValue === docValue.name || filterValue === docValue.id)) || // data object
          (typeof filterValue === 'object' &&
            instanceOfTimePeriod(filterValue) &&
            new Date(docValue) >= filterValue.from &&
            new Date(docValue) <= filterValue.to) || // TimePeriod
          (docValue instanceof Date && filterValue === docValue.toISOString()) || // Date
          (Array.isArray(filterValue) && Array.isArray(docValue) && filterValue.some((fv) => docValue.includes(fv))) || // string[]
          (Array.isArray(filterValue) && filterValue.includes(docValue)) ||
          (Array.isArray(docValue) && docValue.includes(filterValue)) ||
          docValue === filterValue // string
        );
      }),
    );
    const page: Paginated<T[]> = {
      docs: newData,
      limit: paginated.limit ?? Number.MAX_SAFE_INTEGER,
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

  private sortData(data: T[], sort: string) {
    const descending = sort.startsWith('-');
    const sortString = descending ? sort.substring(1) : sort;
    const compareFn = (a: any, b: any) => {
      let aValue = a[sortString];
      let bValue = b[sortString];
      if (['updatedAt', 'createdAt', 'deletedAt'].includes(sortString)) {
        aValue = new Date(a[sortString]).valueOf();
        bValue = new Date(b[sortString]).valueOf();
      }
      return descending ? bValue - aValue : aValue - bValue;
    };
    data.sort(compareFn);
  }
}
