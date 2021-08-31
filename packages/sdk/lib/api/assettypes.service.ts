import { AssetType } from './asset.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';

export class AssetTypesService extends DataService<AssetType> {
  constructor(httpClient: HttpClient) {
    super(httpClient, 'api/assettypes');
  }
}
