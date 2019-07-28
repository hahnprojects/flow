import { Asset } from './asset.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';

export class AssetService extends DataService<Asset> {
  constructor(httpClient: HttpClient) {
    super(httpClient, 'api/assets');
  }
}
