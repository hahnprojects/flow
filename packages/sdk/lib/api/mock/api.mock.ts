import { Event, EventsInterface } from '../events.interface';
import { EndpointMockService } from './endpoint.mock.service';
import { Endpoint } from '../endpoint.interface';
import { readFileSync } from 'fs';
import { join } from 'path';

import { APIInterface } from '../api.interface';
import { Asset, AssetInterface, AssetType } from '../asset.interface';
import { Content, ContentInterface, Storage } from '../content.interface';
import { Secret, SecretInterface } from '../secret.interface';
import { TimeSeries, TimeSeriesCondition, TimeSeriesValue, TimeseriesInterface } from '../timeseries.interface';
import { AssetMockService } from './asset.mock.service';
import { ContentMockService } from './content.mock.service';
import { EndpointInterface } from '../endpoint.interface';
import { SecretMockService } from './secret.mock.service';
import { TimeseriesMockService } from './timeseries.mock.service';
import { Task, TaskInterface } from '../task.interface';
import { TaskMockService } from './task.mock.service';
import { UserInterface } from '../user.interface';
import { UserMockService } from './user.mock.service';
import { EventsMockService } from './events.mock.service';

export class MockAPI implements APIInterface {
  assetManager: AssetInterface;
  contentManager: ContentInterface;
  endpointManager: EndpointInterface;
  secretsManager: SecretInterface;
  timeSeriesManager: TimeseriesInterface;
  sidriveManager = null;
  taskManager: TaskInterface;
  eventsManager: EventsInterface;
  userManager: UserInterface;

  constructor(initData: {
    assets?: AssetInit[];
    contents?: ContentInit[];
    endpoints?: EndpointInit[];
    secrets?: SecretInit[];
    timeSeries?: TimeSeriesInit[];
    tasks?: TaskInit[];
    events?: EventInit[];
    users?: UserInit;
  }) {
    const { assets = [], contents = [], endpoints = [], secrets = [], timeSeries = [], tasks = [], events = [], users } = initData;
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
      assetRef$name: value.assetRef$name,
      assetTsId: value.assetTsId,
      minDate: value.minDate,
      maxBucketTimeRange: 0,
      tsRef: value.tsRef,
      autoDelData: new Date(),
      autoDelBucket: new Date(),
    }));
    const endpoint1: Endpoint[] = endpoints.map((value) => ({
      id: value.id,
      name: value.name,
      description: value.description,
      status: value.status,
      config: value.config,
      readPermissions: [],
      readWritePermissions: [],
    }));
    // TODO: ...
    const tasks1: Task[] = tasks.map((v) => ({
      id: v.id,
      name: v.name,
      readPermissions: [],
      readWritePermissions: [],
      assetRef: v.assetRef,
      assetRef$name: v.assetRef$name,
      subTasks: [],
      assignedTo: v.assignedTo,
      status: v.status,
      acceptedBy: v.acceptedBy,
    }));

    const events1: Event[] = events.map((v) => ({
      id: v.id,
      name: v.name,
      readPermissions: [],
      readWritePermissions: [],
      assetRef: v.assetRef,
      assetRef$name: v.assetRef$name,
      alertRef: v.alertRef,
      alertRef$name: v.alertRef$name,
      tsRef: v.tsRef,
      tsRef$name: v.tsRef$name,
      tags: v.tags,
      cause: v.cause,
      level: v.level,
      group: v.group,
    }));

    const timeseriesValues: TimeSeriesValue[][] = timeSeries.map((v) => v.values);

    this.assetManager = new AssetMockService(this, assets1);
    this.contentManager = new ContentMockService(contents1, contentData);
    this.endpointManager = new EndpointMockService(endpoint1);
    this.secretsManager = new SecretMockService(secrets1);
    this.timeSeriesManager = new TimeseriesMockService(timeSeries1, timeseriesValues);
    this.taskManager = new TaskMockService(this, tasks1);
    this.eventsManager = new EventsMockService(events1);
    this.userManager = new UserMockService(users);
  }
}

export interface AssetInit {
  id: string;
  name: string;
  type: AssetTypeInit | string;
  type$name: string;
  readPermissions?: string[];
  readWritePermissions?: string[];
  notificationEndpoints?: string[];
  tags?: string[];
  parent?: any | Asset;
  parent$name?: string;
  data?: any;
  actions?: string[];
  image?: string;
  attachments?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssetTypeInit {
  id: string;
  name: string;
  allowedParent?: string;
  allowedParent$name?: string;
  readPermissions?: string[];
  readWritePermissions?: string[];
  typeSchema?: any;
  uiSchema?: any;
  supertype?: string;
  supertype$name?: string;
  actions?: string[];
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

export interface EndpointInit {
  id?: string;
  name: string;
  description?: string;
  status?: string;
  config?: {
    type: string;
    url?: string;
    authToken: string;
    recipients?: string[];
  };
  readPermissions?: string[];
  readWritePermissions?: string[];
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
  assetRef$name?: string;
  assetTsId?: string;
  minDate?: Date;
  tsRef?: [string];
  metrics?: string[];
  values: TimeSeriesValue[];
  readPermissions?: string[];
  readWritePermissions?: string[];
}

export interface TaskInit {
  id?: string;
  name: string;
  readPermissions?: string[];
  readWritePermissions?: string[];
  assetRef?: string;
  assetRef$name?: string;
  subTasks?: string[];
  assignedTo: string[];
  status?: string;
  acceptedBy?: string;
}

export interface EventInit {
  id?: string;
  name: string;
  tags?: string[];
  readPermissions?: string[];
  readWritePermissions?: string[];
  assetRef?: string;
  assetRef$name?: string;
  alertRef?: string;
  alertRef$name?: string;
  tsRef?: string;
  tsRef$name?: string;
  eventRef?: string;
  cause?: string;
  level?: string;
  group?: string;
}

export interface UserInit {
  roles: string[];
}
