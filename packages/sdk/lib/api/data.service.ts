import { DataInterface, Filter, Paginated, RequestParameter } from './data.interface';
import { HttpClient } from './http.service';

export class DataService<T> implements DataInterface<T> {
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

  public getMany(params: RequestParameter = {}): Promise<Paginated<T[]>> {
    params.limit = params.limit || 0;
    params.page = params.page || 1;
    return this.httpClient.get<Paginated<T[]>>(`${this.basePath}`, { params });
  }

  public getManyFiltered(filter: Filter, params: RequestParameter = {}): Promise<Paginated<T[]>> {
    params.filter = this.getFilterString(filter);
    return this.getMany(params);
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
