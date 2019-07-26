import { BaseService, Paginated } from './base.service';
import { HttpClient } from './http.service';
import { TimeSeries } from './timeseries.interface';

export class TimeSeriesService extends BaseService<TimeSeries> {
  constructor(httpClient: HttpClient) {
    super(httpClient, 'api/tsm');
  }

  getAllTimeSeries(): Promise<Paginated<TimeSeries[]>> {
    return this.httpClient.get<Paginated<TimeSeries[]>>(this.basePath);
  }

  createOne(timeSeries: TimeSeries): Promise<TimeSeries> {
    return this.httpClient.post<TimeSeries>(this.basePath, timeSeries);
  }

  getManyByAsset(asset: string, options: any = {}) {
    const params = options.populate ? { populate: options.populate } : {};
    return this.httpClient.get<TimeSeries[]>(`${this.basePath}/asset/${asset}`, { params });
  }
}
