import { readFileSync } from 'fs';
import { join } from 'path';

import { APIInterface } from '../api.interface';
import { Asset, AssetInterface, AssetType } from '../asset.interface';
import { Content, ContentInterface, Storage } from '../content.interface';
import { Secret, SecretInterface } from '../secret.interface';
import { SidriveiqInterface } from '../sidriveiq.interface';
import { TimeSeries, TimeSeriesCondition, TimeSeriesValue, TimeseriesInterface } from '../timeseries.interface';
import { AssetMockService } from './asset.mock.service';
import { ContentMockService } from './content.mock.service';
import { SecretMockService } from './secret.mock.service';
import { SidriveiqMockService } from './sidriveiq.mock.service';
import { TimeseriesMockService } from './timeseries.mock.service';

export class MockAPI implements APIInterface {
  assetManager: AssetInterface;
  contentManager: ContentInterface;
  secretsManager: SecretInterface;
  sidriveManager: SidriveiqInterface;
  timeSeriesManager: TimeseriesInterface;

  constructor(assets?: AssetInit[], contents?: ContentInit[], secrets?: SecretInit[], timeSeries?: TimeSeriesInit[]) {
    // convert init data to normal data that the services usually use
    const assetTypes: Array<AssetType | string> = assets
      .map((v) => v.type)
      .map((v) => {
        return typeof v === 'string'
          ? v
          : {
              name: v.name,
              id: v.id,
              readPermissions: [],
              readWritePermissions: [],
              typeSchema: {},
              uiSchema: {},
            };
      });
    const assets1: Asset[] = assets.map((v, index) => ({
      ...v,
      readPermissions: [],
      readWritePermissions: [],
      type: assetTypes[index],
    }));
    const contents1: Content[] = contents.map((v) => ({
      ...v,
      readPermissions: [],
      readWritePermissions: [],
      size: 0,
      fileId: '',
      mimetype: v.mimetype || '',
    }));
    const contentData: any[] = contents.map((v) => {
      return v.data ? v.data : readFileSync(join(v.filePath, v.filename));
    });
    const secrets1: Secret[] = secrets.map((v) => ({ ...v, readPermissions: [], readWritePermissions: [] }));
    const timeSeries1: TimeSeries[] = timeSeries.map((value) => ({
      id: value.id,
      name: value.name,
      description: '',
      readPermissions: [],
      readWritePermissions: [],
      assetRef: value.assetRef,
      assetTsId: value.assetTsId,
      minDate: value.minDate,
      maxBucketTimeRange: 0,
      tsRef: value.tsRef,
      condition: value.condition,
      autoDelData: new Date(),
      autoDelBucket: new Date(),
    }));
    const timeseriesValues: TimeSeriesValue[][] = timeSeries.map((v) => v.values);

    this.assetManager = new AssetMockService(this, assets1);
    this.contentManager = new ContentMockService(contents1, contentData);
    this.secretsManager = new SecretMockService(secrets1);
    this.sidriveManager = new SidriveiqMockService();
    this.timeSeriesManager = new TimeseriesMockService(timeSeries1, timeseriesValues);
  }
}

export interface AssetInit {
  id: string;
  name: string;
  type: AssetTypeInit | string;
  readPermissions?: string[];
  readWritePermissions?: string[];
  tags?: string[];
  parent?: any | Asset;
  data?: any;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetTypeInit {
  id: string;
  name: string;
  allowedParent?: string;
  readPermissions?: string[];
  readWritePermissions?: string[];
  typeSchema?: any;
  uiSchema?: any;
}

export interface ContentInit {
  id: string;
  fileId?: string;
  filename: string;
  filePath?: string;
  mimetype?: string;
  size?: number;
  readPermissions?: string[];
  readWritePermissions?: string[];
  tags?: string[];
  assets?: string[];
  files?: Storage[];
  createdAt?: string;
  updatedAt?: string;
  data?: any;
}

export interface SecretInit {
  id?: string;
  name: string;
  key: string;
  readPermissions?: string[];
  readWritePermissions?: string[];
}

export interface TimeSeriesInit {
  id: string;
  name: string;
  assetRef?: string;
  assetTsId?: string;
  minDate?: Date;
  tsRef?: [string];
  condition?: TimeSeriesCondition;
  values: TimeSeriesValue[];
}
