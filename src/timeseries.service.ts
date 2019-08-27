import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { TimeSeries, TimeSeriesValue } from './timeseries.interface';

export class TimeSeriesService extends DataService<TimeSeries> {
  constructor(httpClient: HttpClient) {
    if(process.env.DEBUG_TSM_URL){
      console.log('update tsm url ' +  process.env.DEBUG_TSM_URL)
      httpClient = httpClient.clone(process.env.DEBUG_TSM_URL);     
    }

    super(httpClient, 'api/tsm'); 
  }

  public addValue(id: string, value: { [values: string]: any }) {
    return this.httpClient.post<void>(`${this.basePath}/${id}`, value);
  }

  public getValues(id: string, from: number, limit?: number) {
    const params = limit ? { limit } : {};
    return this.httpClient.get<TimeSeriesValue[]>(`${this.basePath}/${id}/${from}`, { params });
  }

  public getValuesOfPeriod(id: string, from: number, to: number) {
    return this.httpClient.get<TimeSeriesValue[]>(`${this.basePath}/${id}/${from}/${to}`);
  }

  public getManyByAsset(assetId: string): Promise<TimeSeries[]> {
    return this.httpClient.get<TimeSeries[]>(`${this.basePath}/asset/${assetId}`);
  }
}
