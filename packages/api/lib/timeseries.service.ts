import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { Paginated } from './data.interface';
import { DataService } from './data.service';
import { HttpClient, TokenOption } from './http.service';
import { TimeSeries, TimeSeriesValue, TS_GROUPS } from './timeseries.interface';
import { TrashService } from './trash.service';

interface BaseService extends DataService<TimeSeries>, TrashService<TimeSeries> {}
@mix(DataService, TrashService)
class BaseService extends APIBase {}

export class TimeSeriesService extends BaseService {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/tsm');
  }

  public addValue(id: string, value: { [timestamp: string]: any }, options: TokenOption = {}) {
    return this.httpClient.post<void>(`${this.basePath}/${id}`, value, options);
  }

  /**
   * Adds time series values to an asset by the name of the time series.
   * If the time series does not exist, it is created.
   * @param assetId - The ID of the asset to which the time series values are added.
   * @param name - The name of the time series.
   * @param readPermissions - an array of permissions that allow the user to read the time series.
   * @param readWritePermissions - an array of permissions that allow the user to read and write the time series.
   * @param values - The time series values are specified as an object with the following structure:
   * {
   *   [timestamp: string]: any, // The timestamp and value pairs
   *   ...
   * }
   * @param options
   * @returns a promise that resolves to the time series that was added.
   */
  public addAssetTimeSeriesValues(
    assetId: string,
    name: string,
    readPermissions: string[],
    readWritePermissions: string[],
    values: { [timestamp: string]: any },
    options: TokenOption = {},
  ) {
    const dto = {
      name,
      readPermissions,
      readWritePermissions,
      values,
    };
    return this.httpClient.post<TimeSeries>(`${this.basePath}/assets/${assetId}`, dto, options);
  }

  /**
   * Adds multiple time series values to an asset by the name of the time series.
   * If the time series does not exist, it is created.
   * If the operation is successful, the value property contains the time series that was added.
   * If the operation fails, the reason property contains the error that caused the operation to fail.
   * @param assetId - The ID of the asset to which the time series values are added.
   * @param readPermissions - an array of permissions that allow the user to read the time series.
   * @param readWritePermissions - an array of permissions that allow the user to read and write the time series.
   * @param timeSeries - The time series values are specified as an object with the following structure:
   * {
   *  [timeSeriesName: string]: { // The name of the time series
   *    [timestamp: string]: any, // The timestamp and value pairs
   *    ...
   *  },
   *  ...
   * }
   * @param options
   * @returns a promise that resolves to an array of objects containing the results of the operation.
   * Each object has the following structure:
   * {
   *  status: "fulfilled" | "rejected",
   *  value?: TimeSeries,
   *  reason?: Error,
   * }
   */
  public addManyAssetTimeSeriesValues(
    assetId: string,
    readPermissions: string[],
    readWritePermissions: string[],
    timeSeries: { [timeSeriesName: string]: { [timestamp: string]: any } },
    options: TokenOption = {},
  ) {
    const dtos = Object.entries(timeSeries).map(([name, values]) => ({
      name,
      readPermissions,
      readWritePermissions,
      values,
    }));

    return this.httpClient.post<PromiseSettledResult<TimeSeries>[]>(`${this.basePath}/assets/${assetId}/bulk`, dtos, options);
  }

  public getMostRecentValue(id: string, before?: Date, options: TokenOption = {}): Promise<TimeSeriesValue> {
    const params = before ? { before: before.toISOString() } : {};
    return this.httpClient.get<TimeSeriesValue>(`${this.basePath}/${id}/recent`, { params, ...options });
  }

  public getValues(id: string, from: number, limit?: number, group?: TS_GROUPS, options: TokenOption = {}) {
    const params = { limit, group };
    return this.httpClient.get<TimeSeriesValue[]>(`${this.basePath}/${id}/${from}`, { params, ...options });
  }

  public getValuesOfPeriod(id: string, from: number, to: number, group?: TS_GROUPS, options: TokenOption = {}) {
    const params = { group };
    return this.httpClient.get<TimeSeriesValue[]>(`${this.basePath}/${id}/${from}/${to}`, { params, ...options });
  }

  public getManyByAsset(assetId: string, names?: string[], options: TokenOption = {}): Promise<Paginated<TimeSeries[]>> {
    const params = Array.isArray(names) ? { names: names.join() } : {};
    return this.httpClient.get<Paginated<TimeSeries[]>>(`${this.basePath}/asset/${assetId}`, { params, ...options });
  }
}
