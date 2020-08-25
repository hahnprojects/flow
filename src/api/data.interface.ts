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

export interface Filter {
  tags?: string[];
  type?: string;
  parent?: string;
}

export interface DataInterface<T> {
  addOne(dto: any): Promise<T>;
  addMany(dto: any[]): Promise<T[]>;
  getOne(id: string, options?: any): Promise<T>;
  getMany(params?: RequestParameter, parentId?: string): Promise<Paginated<T[]>>;
  getManyFiltered(filter: Filter, params?: RequestParameter, parentId?: string): Promise<Paginated<T[]>>;
  updateOne(id: string, dto: any): Promise<T>;
  deleteOne(id: string): Promise<any>;
}