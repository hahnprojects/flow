export interface Hierarchy {
  hierarchyTypes: HierarchyType[];
}

export interface HierarchyType {
  type: string;
  mType: string;
  nodes: HierarchyNode[];
}

export interface HierarchyNode {
  id: number;
  refType: string;
  hierarchyPath: string;
  parentMachinePath: string;
  machineType: string;
  name: string;
  severity: string;
}

export interface AssetInfo {
  assetName: string;
  refType: number;
  location: string;
  customer: string;
  plant: string;
  line: string;
  image: string;
  isImageCompressed: boolean;
}

export interface AssetProperty {
  id: string;
  name: string;
  unit: string;
  type: string;
  isHeaderData: boolean;
}

export interface AssetValue {
  timeStamp: string;
  value: any;
}

export interface AssetPropertyValue {
  refAsset: number;
  propertyPath: string;
  timeStamp: string;
  value: any;
  isCompressed: boolean;
}

export interface SidriveiqTimeSeries {
  value: number;
  minValue: number;
  maxValue: number;
  count: number;
  dateOfOccurrence: string;
  inValue: number;
  outValue: number;
}

export interface SidriveiqInterface {
  getAssets(hierarchyTypes?: HierarchyType[]);
  getAssetInfo(assetId: number);
  getAssetProperties(assetId: number);
  getAssetTimeSeries(assetId: number, propertyId: string, from: string, to: string, resolution: number);
  getAssetValues(assetId: number, properties: string, size: number, from: string, to: string);
  getRecentValuesforAssets(assetIds: number[], properties: string[], maxDateTime: string);
}
