import { AssetType } from '../asset.interface';
import { AssetTypesService } from '../assettypes.service';
import { DataMockService } from './data.mock.service';

export class AssetTypesMockService extends DataMockService<AssetType> implements AssetTypesService {
  constructor(assetTypes: AssetType[]) {
    super();
    this.data = assetTypes;
  }
}
