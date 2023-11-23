import { APIBase } from './api-base';
import { DataInterface, Filter, instanceOfTimePeriod, Paginated, RequestParameter } from './data.interface';

export class DataService<T> extends APIBase implements DataInterface<T> {
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

  public deleteOne(id: string, force = false): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${id}`, { params: { force } });
  }

  private getFilterString(filter: Filter) {
    const filters: string[] = [];
    for (const [key, value] of Object.entries(filter)) {
      if (instanceOfTimePeriod(value)) {
        filters.push(`${key}>=${value.from.toISOString()};${key}<=${value.to.toISOString()}`);
      } else if (Array.isArray(value)) {
        filters.push(`${key}=@${value.join(',')}`);
      } else {
        filters.push(`${key}==${value}`);
      }
    }
    return filters.join(';');
  }
}
