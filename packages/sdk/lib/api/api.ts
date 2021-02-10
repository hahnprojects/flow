import { APIInterface } from './api.interface';
import { AssetInterface } from './asset.interface';
import { AssetService } from './asset.service';
import { ContentInterface } from './content.interface';
import { ContentService } from './content.service';
import { EndpointInterface } from './endpoint.interface';
import { EndpointService } from './endpoint.service';
import { HttpClient } from './http.service';
import { SecretInterface } from './secret.interface';
import { SecretService } from './secret.service';
import { SiDriveIqService } from './sidriveiq.service';
import { TimeseriesInterface } from './timeseries.interface';
import { TimeSeriesService } from './timeseries.service';
import { TaskInterface } from './task.interface';
import { TaskService } from './task.service';
import { UserService } from './user.service';

// tslint:disable:no-console
export class API implements APIInterface {
  public httpClient: HttpClient;
  public assetManager: AssetInterface;
  public contentManager: ContentInterface;
  public endpointManager: EndpointInterface;
  public secretsManager: SecretInterface;
  public siDrive: SiDriveIqService;
  public timeSeriesManager: TimeseriesInterface;
  public taskManager: TaskInterface;
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
    this.assetManager = new AssetService(this.httpClient);
    this.contentManager = new ContentService(this.httpClient);
    this.endpointManager = new EndpointService(this.httpClient);
    this.secretsManager = new SecretService(this.httpClient);
    this.siDrive = new SiDriveIqService(this.httpClient);
    this.timeSeriesManager = new TimeSeriesService(this.httpClient);
    this.taskManager = new TaskService(this.httpClient);
    this.userManager = new UserService(this.httpClient);
  }
}
