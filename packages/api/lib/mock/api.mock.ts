import { readFileSync } from 'fs';
import { join } from 'path';

import { API } from '../api';
import { Asset, AssetRevision, AssetType } from '../asset.interface';
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
import { FlowDeploymentService } from '../flow-deployment.service';
import { FlowFunctionService } from '../flow-function.service';
import { FlowModuleService } from '../flow-module.service';
import { FlowService } from '../flow.service';
import { Flow, FlowDiagram } from '../flow.interface';
import { FlowMockService } from './flow.mock.service';
import { FlowDeployment } from '../flow-deployment.interface';
import { FlowDeploymentMockService } from './flow-deployment.mock.service';
import { FlowFunction } from '../flow-function.interface';
import { FlowFunctionsMockService } from './flow-functions.mock.service';
import { FlowModule } from '../flow-module.interface';
import { FlowModulesMockService } from './flow-modules.mock.service';

export class MockAPI implements API {
  public httpClient = null;

  public assets: AssetMockService;
  public assetTypes: AssetTypesMockService;
  public contents: ContentMockService;
  public endpoints: EndpointMockService;
  public events: EventsMockService;
  public flows: FlowService;
  public flowDeployments: FlowDeploymentService;
  public flowFunctions: FlowFunctionService;
  public flowModules: FlowModuleService;
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
    revisions?: AssetRevisionInit[];
    contents?: ContentInit[];
    endpoints?: EndpointInit[];
    secrets?: SecretInit[];
    timeSeries?: TimeSeriesInit[];
    tasks?: TaskInit[];
    events?: EventInit[];
    users?: UserInit;
    flows?: FlowInit[];
    deployments?: FlowDeploymentInit[];
    functions?: FlowFunctionInit[];
    modules?: FlowModuleInit[];
    diagrams?: FlowDiagramInit[];
  }) {
    const {
      assets = [],
      revisions = [],
      contents = [],
      endpoints = [],
      secrets = [],
      timeSeries = [],
      tasks = [],
      events = [],
      users,
      flows = [],
      deployments = [],
      functions = [],
      modules = [],
      diagrams = [],
    } = initData;
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
    const revisions1: AssetRevision[] = revisions.map((v, index) => ({
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

    const diagrams1: FlowDiagram[] = diagrams.map((v) => ({
      ...v,
      json: '',
      author: 'nobody',
    }));
    const flows1: Flow[] = flows.map((v) => ({
      ...v,
      readPermissions: [],
      readWritePermissions: [],
      diagram: diagrams.find((v1) => v1.flow === v.id).id,
      name: `flow-${v.id}`,
      deployments: [],
    }));

    const deployments1: FlowDeployment[] = deployments.map((v) => ({
      ...v,
      readPermissions: [],
      readWritePermissions: [],
      diagram: v.diagram ?? '',
      artifact: null,
      flowModel: { connections: [], elements: [] },
      desiredStatus: 'running',
      actualStatus: 'generating queued',
      target: 'executor',
      name: `deployment-${v.id}`,
    }));

    const functions1: Array<FlowFunction & { id: string }> = functions.map((v) => ({
      ...v,
      category: 'task',
      readPermissions: [],
      readWritePermissions: [],
      author: 'nobody',
      current: v.id,
      history: [v.id, ...((v?.history ?? []) as string[])],
    }));

    const historyMap: Map<string, Array<FlowFunction & { id: string }>> = new Map<string, Array<FlowFunction & { id: string }>>();
    functions1.forEach((func) => {
      (func.history as string[]).forEach((hist) => {
        if (historyMap.has(func.fqn)) {
          historyMap.get(func.fqn).push(functions1.find((v) => v.id === hist));
        } else {
          historyMap.set(func.fqn, [functions1.find((v) => v.id === hist)]);
        }
      });
    });

    const modules1: FlowModule[] = modules.map((v) => ({
      ...v,
      artifacts: [],
      author: 'nobody',
      functions: [],
      readPermissions: [],
      readWritePermissions: [],
    }));

    this.assets = new AssetMockService(this, assets1, revisions1);
    this.contents = new ContentMockService(contents1, contentData);
    this.endpoints = new EndpointMockService(endpoint1);
    this.secrets = new SecretMockService(secrets1);
    this.timeSeries = new TimeseriesMockService(timeSeries1, timeseriesValues);
    this.tasks = new TaskMockService(tasks1);
    this.events = new EventsMockService(events1);
    this.users = new UserMockService(users);
    this.flows = new FlowMockService(flows1, diagrams1);
    this.flowDeployments = new FlowDeploymentMockService(deployments1, this);
    this.flowFunctions = new FlowFunctionsMockService(functions1, historyMap);
    this.flowModules = new FlowModulesMockService(modules1);

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
export type Replace<T, K extends keyof T, TReplace> = Identity<
  Pick<T, Exclude<keyof T, K>> & {
    [P in K]: TReplace;
  }
>;

export type AssetInit = Replace<AtLeast<Asset, 'id' | 'name' | 'type'>, 'type', AssetTypeInit | string>;
export type AssetRevisionInit = Replace<AtLeast<AssetRevision, 'id' | 'name' | 'type'>, 'type', AssetTypeInit | string>;
export type AssetTypeInit = AtLeast<AssetType, 'id' | 'name'>;
export type ContentInit = Identity<AtLeast<Content, 'id' | 'filename'> & { filePath?: string; data?: any }>;
export type EndpointInit = AtLeast<Endpoint, 'name'>;
export type SecretInit = AtLeast<Secret, 'name' | 'key'>;
export type TimeSeriesInit = Identity<AtLeast<TimeSeries, 'id' | 'name'> & { values: TimeSeriesValue[] }>;
export type TaskInit = AtLeast<Task, 'name' | 'assignedTo'>;
export type EventInit = AtLeast<Event, 'name'>;
export type FlowInit = AtLeast<Flow, 'id'>;
export type FlowDeploymentInit = AtLeast<FlowDeployment, 'id' | 'flow'>;
export type FlowFunctionInit = AtLeast<Identity<FlowFunction & { id: string }>, 'fqn' | 'id'>;
export type FlowModuleInit = AtLeast<FlowModule, 'name'>;
export type FlowDiagramInit = AtLeast<FlowDiagram, 'id' | 'flow'>;

export interface UserInit {
  roles: string[];
}
