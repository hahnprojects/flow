import { AssetService } from './asset.service';
import { AssetTypesService } from './assettypes.service';
import { ContentService } from './content.service';
import { EndpointService } from './endpoint.service';
import { EventsService } from './events.service';
import { HttpClient } from './http.service';
import { ProxyService } from './proxy.service';
import { SecretService } from './secret.service';
import { SiDriveIqService } from './sidriveiq.service';
import { TaskService } from './task.service';
import { TimeSeriesService } from './timeseries.service';
import { UserService } from './user.service';

// tslint:disable:no-console
export class API {
  public httpClient: HttpClient;

  public assets: AssetService;
  public assetTypes: AssetTypesService;
  public contents: ContentService;
  public endpoints: EndpointService;
  public events: EventsService;
  public proxy: ProxyService;
  public secrets: SecretService;
  public tasks: TaskService;
  public timeSeries: TimeSeriesService;
  public users: UserService;

  /**
   * @deprecated use "assets" instead
   */
  public assetManager: AssetService;

  /**
   * @deprecated use "contents" instead
   */
  public contentManager: ContentService;

  /**
   * @deprecated use "endpoints" instead
   */
  public endpointManager: EndpointService;

  /**
   * @deprecated use "events" instead
   */
  public eventsManager: EventsService;

  /**
   * @deprecated use "secrets" instead
   */
  public secretsManager: SecretService;

  /**
   * @deprecated use proxy service instead
   */
  public siDrive: SiDriveIqService;

  /**
   * @deprecated use "tasks" instead
   */
  public taskManager: TaskService;

  /**
   * @deprecated use "timeSeries" instead
   */
  public timeSeriesManager: TimeSeriesService;

  /**
   * @deprecated use "users" instead
   */
  public userManager: UserService;

  constructor() {
    let apiBaseUrl = process.env.API_BASE_URL || 'https://testing.hahnpro.com';
    if (!apiBaseUrl.startsWith('https') && !apiBaseUrl.startsWith('http')) {
      console.info('no protocol specified - using HTTPS');
      apiBaseUrl = `https://${apiBaseUrl}`;
    }

    const authBaseUrl = process.env.AUTH_BASE_URL || apiBaseUrl;
    const realm = process.env.AUTH_REALM || 'hpc';
    const client = process.env.API_USER || 'flow-executor-service';
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error('"API_BASE_URL", "API_USER", "AUTH_REALM" and "AUTH_SECRET" environment variables must be set');
    }

    this.httpClient = new HttpClient(apiBaseUrl, authBaseUrl, realm, client, secret);

    this.assets = new AssetService(this.httpClient);
    this.assetTypes = new AssetTypesService(this.httpClient);
    this.contents = new ContentService(this.httpClient);
    this.endpoints = new EndpointService(this.httpClient);
    this.events = new EventsService(this.httpClient);
    this.proxy = new ProxyService(this.httpClient);
    this.secrets = new SecretService(this.httpClient);
    this.tasks = new TaskService(this.httpClient);
    this.timeSeries = new TimeSeriesService(this.httpClient);
    this.users = new UserService(this.httpClient);

    this.assetManager = this.assets;
    this.contentManager = this.contents;
    this.endpointManager = this.endpoints;
    this.eventsManager = this.events;
    this.secretsManager = this.secrets;
    this.siDrive = new SiDriveIqService(this.httpClient);
    this.taskManager = this.tasks;
    this.timeSeriesManager = this.timeSeries;
    this.userManager = this.users;
  }
}
