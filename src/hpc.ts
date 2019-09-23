import { AssetService } from './asset.service';
import { ContentService } from './content.service';
import { HttpClient } from './http.service';
import { SecretService } from './secret.service';
import { SidriveIQService } from './sidriveiq.service';
import { TimeSeriesService } from './timeseries.service';

export class HPC {
  public assetManager: AssetService;
  public contentManager: ContentService;
  public secretsManager: SecretService;
  public sidriveManager: SidriveIQService;
  public timeSeriesManager: TimeSeriesService;

  constructor() {
    const apiPath = process.env.API_BASE_URL || 'https://testing.hahnpro.com';
    // tslint:disable-next-line:no-console
    console.debug('apiPath: ' + apiPath);
    const client = process.env.API_USER || 'flow-executor-service';
    const authApiPath = process.env.API_AUTH_URL || apiPath;
    // tslint:disable-next-line:no-console
    console.debug('authApiPath: ' + authApiPath);
    const realm = process.env.AUTH_REALM || 'hpc';
    // tslint:disable-next-line:no-console
    console.debug('realm: ' + realm);
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error('"API_BASE_URL", "API_USER", "AUTH_REALM" and "AUTH_SECRET" environment variables must be set');
    }

    const httpClient = new HttpClient(apiPath, authApiPath, realm, client, secret);
    this.assetManager = new AssetService(httpClient);
    this.contentManager = new ContentService(httpClient);
    this.secretsManager = new SecretService(httpClient);
    this.sidriveManager = new SidriveIQService(httpClient);
    this.timeSeriesManager = new TimeSeriesService(httpClient);
  }
}
