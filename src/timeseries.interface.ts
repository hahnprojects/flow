export interface TimeSeries {
  id?: string;
  name: string;
  desc?: string;
  minDate?: string;
  maxBucketTimeRange?: number;
  readPermissions: string[];
  readWritePermissions: string[];
  assetRef?: string;
  tsRef?: string[];
  autoDelData?: Date;
  autoDelBucket?: Date;
  condition?: TSCondition;
}

export interface TSCondition {
  operator: string;
  values: number[];
}

export class TimeSeriesValues {
  [values: string]: object;
}
