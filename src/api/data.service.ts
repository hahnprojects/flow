import { HttpClient } from './http.service';

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

export class DataService<T> {
  constructor(protected readonly httpClient: HttpClient, protected readonly basePath) {}

  public addOne(dto: any): Promise<T> {
    return this.httpClient.post<T>(this.basePath, dto);
  }

  public addMany(dto: any[]): Promise<T[]> {
    return this.httpClient.post<T[]>(`${this.basePath}/many`, dto);
  }

  public getOne(id: string, options: any = {}): Promise<T> {
    const params = options.populate ? { populate: options.populate } : {};
    return this.httpClient.get<T>(`${this.basePath}/${id}`, { params });
  }

  public getMany(params: RequestParameter = {}, parentId?: string): Promise<Paginated<T[]>> {
    params.limit = params.limit || 0;
    params.page = params.page || 1;
    parentId = parentId ? '/' + parentId : '';
    return this.httpClient.get<Paginated<T[]>>(`${this.basePath}${parentId}`, { params });
  }

  public getManyFiltered(filter: Filter, params: RequestParameter = {}, parentId?: string): Promise<Paginated<T[]>> {
    params.filter = this.getFilterString(filter);
    return this.getMany(params, parentId);
  }

  public updateOne(id: string, dto: any): Promise<T> {
    return this.httpClient.put<T>(`${this.basePath}/${id}`, dto);
  }

  public deleteOne(id: string): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${id}`);
  }

  protected getFilterString(filter: Filter) {
    // tags%3D%40tag1%20tag2%3Btype%3D%3Dtype%3Bparent%3D%3D5a9d6c5182b56300015371c8
    const { parent, tags, type } = filter;
    const filters: string[] = [];
    if (tags) {
      filters.push('tags=@' + tags.join());
    }
    if (type) {
      filters.push('type==' + type);
    }
    if (parent) {
      filters.push('parent==' + parent);
    }
    return filters.join(';');
  }
}
