export interface TimeSeries {
  id?: string;
  name: string;
  desc: string;
  readPermissions: [string];
  readWritePermissions: [string];
  assetRef: string;
  minDate: Date;
  maxBucketTimeRange: number;
  tsRef: [string];
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
  value: number | string | object;
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
  meta: object;
  final: boolean;
}
