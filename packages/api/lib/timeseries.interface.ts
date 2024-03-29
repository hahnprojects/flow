export interface TimeSeries {
  id?: string;
  name: string;
  description: string;
  readPermissions: string[];
  readWritePermissions: string[];
  assetRef?: string;
  assetRef$name?: string;
  assetTsId?: string;
  maxDate: Date;
  minDate: Date;
  metrics?: string[];
  maxBucketTimeRange: number;
  tsRef?: [string];
  autoDelData: Date;
  autoDelBucket: Date;
  deletedAt?: string;
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

export type TS_GROUPS = 'none' | '10s' | '1m' | '5m' | '15m' | '30m' | '1h' | '3h' | '6h' | '12h' | '1d' | '7d';
