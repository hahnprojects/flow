import { AssetInterface } from './asset.interface';
import { ContentInterface } from './content.interface';
import { SecretInterface } from './secret.interface';
import { TimeseriesInterface } from './timeseries.interface';
import { TaskInterface } from './task.interface';
import { UserInterface } from './user.interface';

export interface APIInterface {
  assetManager: AssetInterface;
  contentManager: ContentInterface;
  secretsManager: SecretInterface;
  timeSeriesManager: TimeseriesInterface;
  taskManager: TaskInterface;
  userManager: UserInterface;
}
