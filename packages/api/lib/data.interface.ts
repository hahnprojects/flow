import { TokenOption } from './http.service';

export interface Paginated<T> {
  docs: T;
  total: number;
  limit: number;
  page?: number;
  pages?: number;
  offset?: number;
}

export interface RequestParameter {
  filter?: string;
  limit?: number;
  page?: number;
  populate?: string;
  sort?: string;
}

interface TimePeriod {
  from: Date;
  to: Date;
}

export function instanceOfTimePeriod(object: any): object is TimePeriod {
  return 'from' in object && 'to' in object;
}

export type Filter = Record<string, string | string[] | TimePeriod>;

export interface DataInterface<T> {
  addOne(dto: any, options?: TokenOption): Promise<T>;
  addMany(dto: any[], options?: TokenOption & { [key: string]: any }): Promise<T[]>;
  getOne(id: string, options?: TokenOption & { [key: string]: any }): Promise<T>;
  getMany(params?: RequestParameter, options?: TokenOption): Promise<Paginated<T[]>>;
  getManyFiltered(filter: Filter, params?: RequestParameter, options?: TokenOption): Promise<Paginated<T[]>>;
  updateOne(id: string, dto: any, options?: TokenOption & { [key: string]: any }): Promise<T>;
  deleteOne(id: string, force: boolean, options?: TokenOption): Promise<any>;
}
