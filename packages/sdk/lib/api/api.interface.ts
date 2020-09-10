import { AssetInterface } from './asset.interface';
import { ContentInterface } from './content.interface';
import { SecretInterface } from './secret.interface';
import { TimeseriesInterface } from './timeseries.interface';

export interface APIInterface {
  assetManager: AssetInterface;
  contentManager: ContentInterface;
  secretsManager: SecretInterface;
  sidriveManager: any;
  timeSeriesManager: TimeseriesInterface;
}
