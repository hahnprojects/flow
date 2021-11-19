import { readFileSync } from 'fs';
import { join } from 'path';

import { API } from '../api';
import { Asset, AssetType } from '../asset.interface';
import { Content } from '../content.interface';
import { Secret } from '../secret.interface';
import { TimeSeries, TimeSeriesValue } from '../timeseries.interface';
import { AssetMockService } from './asset.mock.service';
import { AssetTypesMockService } from './assetTypes.mock.service';
import { ContentMockService } from './content.mock.service';
import { Endpoint } from '../endpoint.interface';
import { EndpointMockService } from './endpoint.mock.service';
import { Event } from '../events.interface';
import { EventsMockService } from './events.mock.service';
import { SecretMockService } from './secret.mock.service';
import { Task } from '../task.interface';
import { TimeseriesMockService } from './timeseries.mock.service';
import { TaskMockService } from './task.mock.service';
import { UserMockService } from './user.mock.service';

export class MockAPI implements API {
  public httpClient = null;

  public assets: AssetMockService;
  public assetTypes: AssetTypesMockService;
  public contents: ContentMockService;
  public endpoints: EndpointMockService;
  public events: EventsMockService;
  public proxy = null;
  public secrets: SecretMockService;
  public tasks: TaskMockService;
  public timeSeries: TimeseriesMockService;
  public users: UserMockService;

  public assetManager: AssetMockService;
  public contentManager: ContentMockService;
  public endpointManager: EndpointMockService;
  public eventsManager: EventsMockService;
  public secretsManager: SecretMockService;
  public siDrive = null;
  public taskManager: TaskMockService;
  public timeSeriesManager: TimeseriesMockService;
  public userManager: UserMockService;

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
      notificationCheckInterval: value.notificationCheckInterval,
      notificationPauseInterval: value.notificationPauseInterval,
      nbOfNotificationsBetweenPauseInterval: value.nbOfNotificationsBetweenPauseInterval,
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
      tsRef: v.tsRef,
      tags: v.tags,
      cause: v.cause,
      level: v.level,
      group: v.group,
    }));

    const timeseriesValues: TimeSeriesValue[][] = timeSeries.map((v) => v.values);

    this.assets = new AssetMockService(this, assets1);
    this.contents = new ContentMockService(contents1, contentData);
    this.endpoints = new EndpointMockService(endpoint1);
    this.secrets = new SecretMockService(secrets1);
    this.timeSeries = new TimeseriesMockService(timeSeries1, timeseriesValues);
    this.tasks = new TaskMockService(tasks1);
    this.events = new EventsMockService(events1);
    this.users = new UserMockService(users);

    this.assetManager = this.assets;
    this.contentManager = this.contents;
    this.endpointManager = this.endpoints;
    this.secretsManager = this.secrets;
    this.timeSeriesManager = this.timeSeries;
    this.taskManager = this.tasks;
    this.eventsManager = this.events;
    this.userManager = this.users;
  }
}

export type Identity<T> = { [P in keyof T]: T[P] };
export type AtLeast<T, K extends keyof T> = Identity<Partial<T> & Pick<T, K>>;
export type Replace<T, K extends keyof T, TReplace> = Identity<Pick<T, Exclude<keyof T, K>> & {
  [P in K]: TReplace;
}>;

export type AssetInit = Replace<AtLeast<Asset, 'id' | 'name' | 'type'>, 'type', AssetTypeInit | string>;
export type AssetTypeInit = AtLeast<AssetType, 'id' | 'name'>;
export type ContentInit = Identity<AtLeast<Content, 'id' | 'filename'> & { filePath?: string, data?: any }>;
export type EndpointInit = AtLeast<Endpoint, 'name'>;
export type SecretInit = AtLeast<Secret, 'name' | 'key'>;
export type TimeSeriesInit = Identity<AtLeast<TimeSeries, 'id' | 'name'> & { values: TimeSeriesValue[] }>;
export type TaskInit = AtLeast<Task, 'name' | 'assignedTo'>;
export type EventInit = AtLeast<Event, 'name'>;

export interface UserInit {
  roles: string[];
}
