import { APIInterface } from './api.interface';
import { AssetInterface } from './asset.interface';
import { AssetService } from './asset.service';
import { ContentInterface } from './content.interface';
import { ContentService } from './content.service';
import { HttpClient } from './http.service';
import { SecretInterface } from './secret.interface';
import { SecretService } from './secret.service';
import { SiDriveIqService } from './sidriveiq.service';
import { SiDriveIqLegacyInterface } from './sidriveiq.legacy.interface';
import { SiDriveIqLegacyService } from './sidriveiq.legacy.service';
import { TimeseriesInterface } from './timeseries.interface';
import { TimeSeriesService } from './timeseries.service';
import { TaskInterface } from './task.interface';
import { TaskService } from './task.service';

// tslint:disable:no-console
export class API implements APIInterface {
  public assetManager: AssetInterface;
  public contentManager: ContentInterface;
  public secretsManager: SecretInterface;
  public siDrive: SiDriveIqService;
  public sidriveManager: SiDriveIqLegacyInterface;
  public timeSeriesManager: TimeseriesInterface;
  public taskManager: TaskInterface;

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

    const httpClient = new HttpClient(apiBaseUrl, authBaseUrl, realm, client, secret);
    this.assetManager = new AssetService(httpClient);
    this.contentManager = new ContentService(httpClient);
    this.secretsManager = new SecretService(httpClient);
    this.siDrive = new SiDriveIqService(httpClient);
    this.sidriveManager = new SiDriveIqLegacyService(httpClient);
    this.timeSeriesManager = new TimeSeriesService(httpClient);
    this.taskManager = new TaskService(httpClient);
  }
}
