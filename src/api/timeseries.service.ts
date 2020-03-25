import { DataService, Paginated } from './data.service';
import { HttpClient } from './http.service';
import { TimeSeries, TimeSeriesValue } from './timeseries.interface';

type TS_GROUPS  = '10s'|'1m'|'5m'|'15m'|'30m'|'1h'|'3h'|'6h'|'12h'|'1d'|'7d';
export class TimeSeriesService extends DataService<TimeSeries> {
  

  constructor(httpClient: HttpClient) {
    super(httpClient, process.env.DEBUG_TSM_URL || 'api/tsm');
  }

  public addValue(id: string, value: { [values: string]: any }) {
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

  public getMostRecentValue(id: string, before: Date) {
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
}
