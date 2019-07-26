import { HttpClient } from './http.service';

export interface Paginated<T> {
  docs: T;
  total: number;
  limit: number;
  page?: number;
  pages?: number;
  offset?: number;
}

export class BaseService<T> {
  constructor(protected readonly httpClient: HttpClient, protected readonly basePath) {}

  addOne(dto: any): Promise<T> {
    return this.httpClient.post<T>(this.basePath, dto);
  }

  getOne(id: string, options: any = {}): Promise<T> {
    const params = options.populate ? { populate: options.populate } : {};
    return this.httpClient.get<T>(`${this.basePath}/${id}`, { params });
  }

  getMany(options: any = {}, filter?: string, parentId?: string): Promise<Paginated<T[]>> {
    const params: any = {
      limit: options.limit ? options.limit.toString() : '0',
      page: options.page ? options.page.toString() : '1',
      sort: options.sort,
    };
    if (filter) {
      params.filter = filter;
    }
    parentId = parentId ? '/' + parentId : '';
    return this.httpClient.get<Paginated<T[]>>(`${this.basePath}${parentId}`, { params });
  }

  updateOne(id: string, dto: any): Promise<T> {
    return this.httpClient.put<T>(`${this.basePath}/${id}`, dto);
  }

  deleteOne(id: string): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${id}`);
  }
}
