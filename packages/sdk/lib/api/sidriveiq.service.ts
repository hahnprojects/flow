import { HttpClient } from './http.service';
import { Asset, List, Log, Mail, Property, Severity, Subset, TimeSeries } from './sidriveiq.interface';

export class SiDriveIqService {
  private basePath: string;

  constructor(private readonly httpClient: HttpClient) {
    this.basePath = 'api/sidrive/api/v0';
  }

  public getAssets(limit?: number, cursor?: string) {
    const params = {
      ...(limit && { limit }),
      ...(cursor && { cursor }),
    };
    return this.httpClient.get<List<Asset>>(`${this.basePath}/assets`, { params });
  }

  public getAssetCount() {
    return this.httpClient.get<number>(`${this.basePath}/assets/count`);
  }

  public getAsset(assetId: string | number) {
    return this.httpClient.get<Asset>(`${this.basePath}/assets/${assetId}`);
  }

  public getProperties(assetId: string | number, path_filter?: string, subset_filter?: string, limit?: number, cursor?: string) {
    const params = {
      ...(path_filter && { path_filter }),
      ...(subset_filter && { subset_filter }),
      ...(limit && { limit }),
      ...(cursor && { cursor }),
    };
    return this.httpClient.get<List<Property>>(`${this.basePath}/assets/${assetId}/properties`, { params });
  }

  public getProperty(assetId: string | number, path: string) {
    return this.httpClient.get<Property>(`${this.basePath}/assets/${assetId}/properties/${path}`);
  }

  public getTimeSeries(assetId: string | number, path: string, from?: Date, to?: Date, limit?: number, cursor?: string) {
    const params = {
      ...(from && { from: from.toISOString() }),
      ...(to && { to: to.toISOString() }),
      ...(limit && { limit }),
      ...(cursor && { cursor }),
    };
    return this.httpClient.get<List<TimeSeries>>(`${this.basePath}/assets/${assetId}/properties/${path}/timeseries`, { params });
  }

  public getTimeSeriesCount(assetId: string | number, path: string) {
    return this.httpClient.get<number>(`${this.basePath}/assets/${assetId}/properties/${path}/timeseries/count`);
  }

  public getRecentTimeSeries(assetId: string | number, path: string, timestamp?: Date) {
    const params = { ...(timestamp && { timestamp: timestamp.toISOString() }) };
    return this.httpClient.get<TimeSeries>(`${this.basePath}/assets/${assetId}/properties/${path}/timeseries/recent`, { params });
  }

  public addTimeSeries(assetId: string | number, path: string, values: TimeSeries[]) {
    return this.httpClient.post<void>(`${this.basePath}/assets/${assetId}/properties/${path}/timeseries`, values);
  }

  public getSubsets(assetId: string | number) {
    return this.httpClient.get<List<TimeSeries>>(`${this.basePath}/assets/${assetId}/subsets`);
  }

  public getSubset(assetId: string | number, subsetId: string) {
    return this.httpClient.get<Subset>(`${this.basePath}/assets/${assetId}/subsets/${subsetId}`);
  }

  public getSubsetProperties(assetId: string | number, subsetId: string) {
    return this.httpClient.get<List<Property>>(`${this.basePath}/assets/${assetId}/subsets/${subsetId}/properties`);
  }

  public getLogs(
    assetId: string | number,
    categories: string[],
    options: {
      from?: string;
      to?: string;
      severity?: Severity;
      page?: number;
      page_size?: number;
      filter?: string;
      sort?: string;
    },
  ) {
    const params = { categories, ...options };
    return this.httpClient.get<List<Log>>(`${this.basePath}/assets/${assetId}/logs`, { params });
  }

  public sendMail(mail: Mail) {
    return this.httpClient.post<string>(`${this.basePath}/mails`, mail);
  }
}
