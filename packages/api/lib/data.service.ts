import { APIBase } from './api-base';
import { DataInterface, Filter, instanceOfTimePeriod, Paginated, RequestParameter } from './data.interface';
import { TokenOption } from './http.service';

export class DataService<T> extends APIBase implements DataInterface<T> {
  public addOne(dto: any, options: TokenOption = {}): Promise<T> {
    return this.httpClient.post<T>(this.basePath, dto, options);
  }

  public addMany(dto: any[], options: TokenOption = {}): Promise<T[]> {
    return this.httpClient.post<T[]>(`${this.basePath}/many`, dto, options);
  }

  public getOne(id: string, options: TokenOption & { [key: string]: any } = {}): Promise<T> {
    const params = options.populate ? { populate: options.populate } : {};
    return this.httpClient.get<T>(`${this.basePath}/${id}`, { params });
  }

  public getMany(params: RequestParameter = {}, options: TokenOption = {}): Promise<Paginated<T[]>> {
    params.limit = params.limit || 0;
    params.page = params.page || 1;
    return this.httpClient.get<Paginated<T[]>>(`${this.basePath}`, { params, ...options });
  }

  /**
   * Filters the elements by the passed properties. The object with these properties has to be of the form:
   * {
   *   propertyName: string | string[] | { from: Date, to: Date },
   *   ...
   * }.
   * @param filter The Object with the properties to filter by.
   * @param params Other request parameters.
   * @param options
   */
  public getManyFiltered(filter: Filter, params: RequestParameter = {}, options: TokenOption = {}): Promise<Paginated<T[]>> {
    params.filter = this.getFilterString(filter);
    return this.getMany(params, options);
  }

  public updateOne(id: string, dto: any, options: TokenOption & { [key: string]: any } = {}): Promise<T> {
    return this.httpClient.put<T>(`${this.basePath}/${id}`, dto, options);
  }

  public deleteOne(id: string, force = false, options: TokenOption = {}): Promise<any> {
    return this.httpClient.delete(`${this.basePath}/${id}`, { params: { force }, ...options });
  }

  private getFilterString(filter: Filter) {
    const filters: string[] = [];
    for (const [key, value] of Object.entries(filter)) {
      if (value != null && value !== '') {
        // filter out null and undefined values and empty strings
        if (typeof value === 'object' && instanceOfTimePeriod(value)) {
          filters.push(`${key}>=${value.from.toISOString()};${key}<=${value.to.toISOString()}`);
        } else if (Array.isArray(value)) {
          filters.push(`${key}=@${value.join(',')}`);
        } else {
          filters.push(`${key}==${value}`);
        }
      }
    }
    return filters.join(';');
  }
}
