import { AssetService } from './asset.service';
import { AssetTypesService } from './assettypes.service';
import { ContentService } from './content.service';
import { EndpointService } from './endpoint.service';
import { EventsService } from './events.service';
import { HttpClient } from './http.service';
import { ProxyService } from './proxy.service';
import { SecretService } from './secret.service';
import { TaskService } from './task.service';
import { TimeSeriesService } from './timeseries.service';
import { UserService } from './user.service';
import { FlowService } from './flow.service';
import { FlowFunctionService } from './flow-function.service';
import { FlowModuleService } from './flow-module.service';
import { FlowDeploymentService } from './flow-deployment.service';
import { LabelService } from './label.service';
import { VaultService } from './vault.service';
import { NotificationService } from './notification.service';

export class API {
  public assets: AssetService;
  public assetTypes: AssetTypesService;
  public contents: ContentService;
  public endpoints: EndpointService;
  public events: EventsService;
  public flows: FlowService;
  public flowDeployments: FlowDeploymentService;
  public flowFunctions: FlowFunctionService;
  public flowModules: FlowModuleService;
  public labels: LabelService;
  public proxy: ProxyService;
  public secrets: SecretService;
  public tasks: TaskService;
  public timeSeries: TimeSeriesService;
  public users: UserService;
  public vault: VaultService;
  public notifications: NotificationService;

  constructor(
    public readonly httpClient?: HttpClient,
    context?: { tokenSubject?: string },
  ) {
    if (!httpClient) {
      // remove leading and trailing slashes
      const normalizePath = (value = '', defaultValue = '') => value.replace(/(?:^\/+)|(?:\/+$)/g, '') || defaultValue;

      let apiBaseUrl = process.env.API_BASE_URL || 'https://testing.hahnpro.com';
      if (!apiBaseUrl.startsWith('https') && !apiBaseUrl.startsWith('http')) {
        /* eslint-disable-next-line no-console */
        console.info('no protocol specified - using HTTPS');
        apiBaseUrl = `https://${apiBaseUrl}`;
      }
      const apiUrl = apiBaseUrl + '/' + normalizePath(process.env.API_BASE_PATH, 'api');
      const authBaseUrl = process.env.AUTH_BASE_URL || apiBaseUrl;
      const authUrl = authBaseUrl + '/' + normalizePath(process.env.AUTH_BASE_PATH, 'auth');
      const realm = process.env.AUTH_REALM || 'hpc';
      const client = process.env.API_USER || 'flow-executor-service';
      const secret = process.env.AUTH_SECRET;
      if (!secret) {
        throw new Error('"API_BASE_URL", "API_USER", "AUTH_REALM" and "AUTH_SECRET" environment variables must be set');
      }
      this.httpClient = new HttpClient(apiUrl, authUrl, realm, client, secret, context?.tokenSubject);
    }

    this.assets = new AssetService(this.httpClient);
    this.assetTypes = new AssetTypesService(this.httpClient);
    this.contents = new ContentService(this.httpClient);
    this.endpoints = new EndpointService(this.httpClient);
    this.events = new EventsService(this.httpClient);
    this.flows = new FlowService(this.httpClient);
    this.flowDeployments = new FlowDeploymentService(this.httpClient);
    this.flowFunctions = new FlowFunctionService(this.httpClient);
    this.flowModules = new FlowModuleService(this.httpClient);
    this.labels = new LabelService(this.httpClient);
    this.proxy = new ProxyService(this.httpClient);
    this.secrets = new SecretService(this.httpClient);
    this.tasks = new TaskService(this.httpClient);
    this.timeSeries = new TimeSeriesService(this.httpClient);
    this.users = new UserService(this.httpClient);
    this.vault = new VaultService(this.httpClient);
    this.notifications = new NotificationService(this.httpClient);
  }
}
