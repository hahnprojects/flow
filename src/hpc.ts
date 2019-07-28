import { AssetService } from './asset.service';
import { ContentService } from './content.service';
import { HttpClient } from './http.service';
import { TimeSeriesService } from './timeseries.service';

export class HPC {
  public assetManager: AssetService;
  public contentManager: ContentService;
  public timeSeriesManager: TimeSeriesService;

  constructor() {
    const apiPath = process.env.API_BASE_URL || 'https://testing.hahnpro.com';
    const realm = process.env.API_REALM || 'hpc';
    const client = process.env.API_USER || 'flow-executor-service';
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error('"API_BASE_URL", "API_REALM", "API_USER" and "AUTH_SECRET" environment variables must be set');
    }

    const httpClient = new HttpClient(apiPath, realm, client, secret);
    this.assetManager = new AssetService(httpClient);
    this.contentManager = new ContentService(httpClient);
    this.timeSeriesManager = new TimeSeriesService(httpClient);
  }
}
