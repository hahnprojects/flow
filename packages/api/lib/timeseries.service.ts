import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { Paginated } from './data.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { TimeSeries, TimeSeriesValue, TS_GROUPS } from './timeseries.interface';
import { TrashService } from './trash.service';

interface BaseService extends DataService<TimeSeries>, TrashService<TimeSeries> {}
@mix(DataService, TrashService)
class BaseService extends APIBase {}

export class TimeSeriesService extends BaseService {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/tsm');
  }

  public addValue(id: string, value: { [timestamp: string]: any }) {
    return this.httpClient.post<void>(`${this.basePath}/${id}`, value);
  }

  // Creates or Finds a TimeSeries for an assetId and a name
  // Then adds the values to the TimeSeries
  public addAssetTimeSeriesValues(
    assetId: string,
    name: string,
    readPermissions: string[],
    readWritePermissions: string[],
    values: { [timestamp: string]: any },
  ) {
    const dto = {
      name,
      readPermissions,
      readWritePermissions,
      values,
    };
    return this.httpClient.post<TimeSeries>(`${this.basePath}/assets/${assetId}`, dto);
  }

  public getMostRecentValue(id: string, before: Date): Promise<TimeSeriesValue> {
    const params = before ? { before: before.toISOString() } : {};
    return this.httpClient.get<TimeSeriesValue>(`${this.basePath}/${id}/recent`, { params });
  }

  public getValues(id: string, from: number, limit?: number, group?: TS_GROUPS) {
    const params = { limit, group };
    return this.httpClient.get<TimeSeriesValue[]>(`${this.basePath}/${id}/${from}`, { params });
  }

  public getValuesOfPeriod(id: string, from: number, to: number, group?: TS_GROUPS) {
    const params = { group };
    return this.httpClient.get<TimeSeriesValue[]>(`${this.basePath}/${id}/${from}/${to}`, { params });
  }

  public getManyByAsset(assetId: string, names?: string[]): Promise<Paginated<TimeSeries[]>> {
    const params = Array.isArray(names) ? { names: names.join() } : {};
    return this.httpClient.get<Paginated<TimeSeries[]>>(`${this.basePath}/asset/${assetId}`, { params });
  }

  public async getMostRecentTimeSeriesValueByAssetAndTimeSeriesName(assetId: string, timeSeriesName: string) {
    const params = { names: timeSeriesName };
    return this.httpClient.get<TimeSeriesValue>(`${this.basePath}/asset/${assetId}/recent`, { params });
  }
}
