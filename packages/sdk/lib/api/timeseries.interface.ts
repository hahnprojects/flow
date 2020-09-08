import { DataInterface, Paginated } from './data.interface';

export interface TimeSeries {
  id?: string;
  name: string;
  description: string;
  readPermissions: string[];
  readWritePermissions: string[];
  assetRef?: string;
  assetTsId?: string;
  minDate: Date;
  maxBucketTimeRange: number;
  tsRef?: [string];
  condition: TimeSeriesCondition;
  autoDelData: Date;
  autoDelBucket: Date;
}

export interface TimeSeriesCondition {
  operator: string;
  values: number[];
}

export interface TimeSeriesValue {
  timestamp: number;
  value: number | string | any;
  [key: string]: any;
}

export interface TimeSeriesBucket {
  id?: string;
  ts: TimeSeries;
  prev: TimeSeriesBucket;
  next: TimeSeriesBucket;
  prevHash: string;
  from: Date;
  to: Date;
  bucketSize: number;
  data: TimeSeriesValue[];
  meta: any;
  final: boolean;
}

export type TS_GROUPS = '10s' | '1m' | '5m' | '15m' | '30m' | '1h' | '3h' | '6h' | '12h' | '1d' | '7d';

export interface TimeseriesInterface extends DataInterface<TimeSeries> {
  addValue(id: string, value: { [values: string]: any });
  addAssetTimeSeriesValues(
    assetId: string,
    name: string,
    readPermissions: string[],
    readWritePermissions: string[],
    values: { [timestamp: string]: any },
  );
  getMostRecentValue(id: string, before: Date): Promise<TimeSeriesValue>;
  getValues(id: string, from: number, limit?: number, group?: TS_GROUPS);
  getValuesOfPeriod(id: string, from: number, to: number, group?: TS_GROUPS);
  getManyByAsset(assetId: string, names?: string[]): Promise<Paginated<TimeSeries[]>>;
}
