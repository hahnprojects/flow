import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { TimeSeries, TimeSeriesValue } from './timeseries.interface';

export class TimeSeriesService extends DataService<TimeSeries> {
  constructor(httpClient: HttpClient) {
    super(httpClient, 'api/tsm');
  }

  public addValue(id: string, value: { [values: string]: any }) {
    return this.httpClient.post<void>(`${this.basePath}/${id}`, value);
  }

  public getMostRecentValue(id: string, before: Date) {
    const params = before ? { before: before.toISOString() } : {};
    return this.httpClient.get<TimeSeriesValue>(`${this.basePath}/${id}/recent`, { params });
  }

  public getValues(id: string, from: number, limit?: number) {
    const params = limit ? { limit } : {};
    return this.httpClient.get<TimeSeriesValue[]>(`${this.basePath}/${id}/${from}`, { params });
  }

  public getValuesOfPeriod(id: string, from: number, to: number) {
    return this.httpClient.get<TimeSeriesValue[]>(`${this.basePath}/${id}/${from}/${to}`);
  }

  public getManyByAsset(assetId: string, names?: string[]): Promise<TimeSeries[]> {
    const params = Array.isArray(names) ? { names: names.join() } : {};
    return this.httpClient.get<TimeSeries[]>(`${this.basePath}/asset/${assetId}`, { params });
  }
}
