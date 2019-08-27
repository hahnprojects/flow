import { AssetService } from './asset.service';
import { ContentService } from './content.service';
import { HttpClient } from './http.service';
import { SecretService } from './secret.service';
import { TimeSeriesService } from './timeseries.service';

export class HPC {
  public assetManager: AssetService;
  public contentManager: ContentService;
  public secretsManager: SecretService;
  public timeSeriesManager: TimeSeriesService;

  constructor() {
    const apiPath = process.env.API_BASE_URL || 'https://testing.hahnpro.com';
    const client = process.env.API_USER || 'flow-executor-service';
    
    const authApiPath = process.env.API_AUTH_URL || apiPath;
    const realm = process.env.AUTH_REALM || 'hpc';
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error('"API_BASE_URL", "API_USER", "AUTH_REALM" and "AUTH_SECRET" environment variables must be set');
    }

    const httpClient = new HttpClient(apiPath, authApiPath, realm, client, secret);
    this.assetManager = new AssetService(httpClient);
    this.contentManager = new ContentService(httpClient);
    this.secretsManager = new SecretService(httpClient);
    this.timeSeriesManager = new TimeSeriesService(httpClient);
  }
}
