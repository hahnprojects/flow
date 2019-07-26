import { Asset } from './asset.interface';
import { BaseService } from './base.service';
import { HttpClient } from './http.service';

export class AssetService extends BaseService<Asset> {
  constructor(httpClient: HttpClient) {
    super(httpClient, 'api/assets');
  }
}
