import { HierarchyType, SidriveiqInterface } from '../sidriveiq.interface';

export class SidriveiqMockService implements SidriveiqInterface {
  getAssetInfo(assetId: number) {
    // TODO implement
  }

  getAssetProperties(assetId: number) {
    // TODO implement
  }

  getAssetTimeSeries(assetId: number, propertyId: string, from: string, to: string, resolution: number) {
    // TODO implement
  }

  getAssetValues(assetId: number, properties: string, size: number, from: string, to: string) {
    // TODO implement
  }

  getAssets(hierarchyTypes?: HierarchyType[]) {
    // TODO implement
  }

  getRecentValuesForAssets(assetIds: number[], properties: string[], maxDateTime: string) {
    // TODO implement
  }

}