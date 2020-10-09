import FormData from 'form-data';

import { HttpClient } from './http.service';
import {
  Asset,
  AssetsParams,
  File,
  FilesParams,
  FilesCountParams,
  List,
  Log,
  LogsParams,
  LogDto,
  Mail,
  Property,
  PropertiesParams,
  RangeParams,
  Subset,
  TimeSeries,
  TimeSeriesParams,
} from './sidriveiq.interface';

export class SiDriveIqService {
  private basePath: string;

  constructor(private readonly httpClient: HttpClient) {
    this.basePath = 'api/sidrive/api/v0';
  }

  public getAssets(params: AssetsParams = {}) {
    return this.httpClient.get<List<Asset>>(`${this.basePath}/assets`, { params });
  }

  public getAssetCount(params: AssetsParams = {}) {
    return this.httpClient.get<number>(`${this.basePath}/assets/count`, { params });
  }

  public getAsset(assetId: string | number) {
    return this.httpClient.get<Asset>(`${this.basePath}/assets/${assetId}`);
  }

  public getProperties(assetId: string | number, params: PropertiesParams = {}) {
    return this.httpClient.get<List<Property>>(`${this.basePath}/assets/${assetId}/properties`, { params });
  }

  public getProperty(assetId: string | number, path: string) {
    return this.httpClient.get<Property>(`${this.basePath}/assets/${assetId}/properties/${path}`);
  }

  public getSubsets(assetId: string | number) {
    return this.httpClient.get<List<TimeSeries>>(`${this.basePath}/assets/${assetId}/subsets`);
  }

  public getSubset(assetId: string | number, subsetId: string) {
    return this.httpClient.get<Subset>(`${this.basePath}/assets/${assetId}/subsets/${subsetId}`);
  }

  public getSubsetProperties(assetId: string | number, subsetId: string, pathFilter?: string) {
    const params = { ...(pathFilter && { path_filter: pathFilter }) };
    return this.httpClient.get<List<Property>>(`${this.basePath}/assets/${assetId}/subsets/${subsetId}/properties`, { params });
  }

  public getTimeSeries(assetId: string | number, path: string, params: TimeSeriesParams = {}) {
    params = this.convertDates(params);
    return this.httpClient.get<List<TimeSeries>>(`${this.basePath}/assets/${assetId}/properties/${path}/timeseries`, { params });
  }

  public getTimeSeriesCount(assetId: string | number, path: string, params: RangeParams = {}) {
    params = this.convertDates(params);
    return this.httpClient.get<number>(`${this.basePath}/assets/${assetId}/properties/${path}/timeseries/count`, { params });
  }

  public getRecentTimeSeries(assetId: string | number, path: string, timestamp?: Date) {
    const params = { ...(timestamp && { timestamp: timestamp.toISOString() }) };
    return this.httpClient.get<TimeSeries>(`${this.basePath}/assets/${assetId}/properties/${path}/timeseries/recent`, { params });
  }

  public addTimeSeries(assetId: string | number, path: string, values: TimeSeries[]) {
    return this.httpClient.post<void>(`${this.basePath}/assets/${assetId}/properties/${path}/timeseries`, values);
  }

  public getFiles(assetId: string | number, params: FilesParams = {}) {
    params = this.convertDates(params);
    return this.httpClient.get<File[]>(`${this.basePath}/assets/${assetId}/files/import`, { params });
  }

  public getFileCount(assetId: string | number, params: FilesCountParams = {}) {
    params = this.convertDates(params);
    return this.httpClient.get<number>(`${this.basePath}/assets/${assetId}/files/import/count`, { params });
  }

  public getFile(assetId: string | number, fileId: string) {
    return this.httpClient.get<File>(`${this.basePath}/assets/${assetId}/files/import/${fileId}`);
  }

  public downloadFile(assetId: string | number, fileId: string) {
    return this.httpClient.get<ArrayBuffer>(`${this.basePath}/assets/${assetId}/files/import/${fileId}/download`, {
      headers: { 'response-type': 'arraybuffer' },
      responseType: 'arraybuffer',
    });
  }

  public uploadFile(assetId: string | number, form: FormData) {
    const headers = { ...form.getHeaders() };
    return this.httpClient.post<string>(`${this.basePath}/assets/${assetId}/files/import`, form, { headers });
  }

  public deleteFile(assetId: string | number, fileId: string) {
    return this.httpClient.delete<void>(`${this.basePath}/assets/${assetId}/files/import/${fileId}`);
  }

  public getLogs(assetId: string | number, params: LogsParams) {
    params = this.convertDates(params);
    return this.httpClient.get<List<Log>>(`${this.basePath}/assets/${assetId}/logs`, { params });
  }

  public getLogCount(assetId: string | number, params: LogsParams) {
    params = this.convertDates(params);
    return this.httpClient.get<number>(`${this.basePath}/assets/${assetId}/logs/count`, { params });
  }

  public addLog(assetId: string | number, item: LogDto) {
    return this.httpClient.post<void>(`${this.basePath}/assets/${assetId}/logs`, item);
  }

  public sendMail(mail: Mail) {
    return this.httpClient.post<string>(`${this.basePath}/mails`, mail);
  }

  private convertDates<T extends RangeParams>(params: T): T {
    if (params.from) {
      params.from = new Date(params.from).toISOString();
    }
    if (params.to) {
      params.to = new Date(params.to).toISOString();
    }
    return params;
  }
}
