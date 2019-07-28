import { DataService, RequestParameter } from './data.service';
import { HttpClient } from './http.service';
import { TimeSeries, TimeSeriesValue } from './timeseries.interface';

export class TimeSeriesService extends DataService<TimeSeries> {
  constructor(httpClient: HttpClient) {
    super(httpClient, 'api/tsm');
  }

  addValue(id: string, value: any) {
    return this.httpClient.post<void>(`${this.basePath}/${id}`, value);
  }

  getValues(id: string, from: number, limit?: number) {
    const params = limit ? { limit } : {};
    return this.httpClient.get<TimeSeriesValue[]>(`${this.basePath}/${id}/${from}`, { params });
  }

  getValuesOfPeriod(id: string, from: number, to: number) {
    return this.httpClient.get<TimeSeriesValue[]>(`${this.basePath}/${id}/${from}/${to}`);
  }

  getManyByAsset(assetId: string, options: RequestParameter = {}) {
    return this.getMany(options, `asset/${assetId}`);
  }
}
