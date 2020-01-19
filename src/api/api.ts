import { AssetService } from './asset.service';
import { ContentService } from './content.service';
import { HttpClient } from './http.service';
import { SecretService } from './secret.service';
import { SidriveIQService } from './sidriveiq.service';
import { TimeSeriesService } from './timeseries.service';

// tslint:disable:no-console
export class API {
  public assetManager: AssetService;
  public contentManager: ContentService;
  public secretsManager: SecretService;
  public sidriveManager: SidriveIQService;
  public timeSeriesManager: TimeSeriesService;

  constructor() {
    const apiBaseUrl = process.env.API_BASE_URL || 'https://testing.hahnpro.com';
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
    this.sidriveManager = new SidriveIQService(httpClient);
    this.timeSeriesManager = new TimeSeriesService(httpClient);
  }
}
