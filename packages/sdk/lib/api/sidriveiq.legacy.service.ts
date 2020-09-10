import { HttpClient } from './http.service';
import {
  AssetInfo,
  AssetProperty,
  AssetPropertyValue,
  AssetValue,
  Hierarchy,
  HierarchyType,
  SiDriveIqLegacyInterface,
  SiDriveIqTimeSeries,
} from './sidriveiq.legacy.interface';

export class SiDriveIqLegacyService implements SiDriveIqLegacyInterface {
  private basePath: string;

  constructor(private readonly httpClient: HttpClient) {
    this.basePath = process.env.DEBUG_SIDRIVE_URL || 'api/sidrive';
  }

  public getAssets(hierarchyTypes?: HierarchyType[]) {
    const body: Hierarchy = {
      hierarchyTypes: hierarchyTypes || [
        { type: 'Continent', mType: 'Continent', nodes: [] },
        { type: 'Country', mType: 'Country', nodes: [] },
        { type: 'Customer', mType: 'Customer', nodes: [] },
        { type: 'Plant', mType: 'Plant', nodes: [] },
        { type: 'Plant', mType: 'Site', nodes: [] },
        { type: 'Line', mType: 'Fleet', nodes: [] },
        { type: 'Line', mType: 'Line', nodes: [] },
        { type: 'Device', mType: 'Device', nodes: [] },
        { type: 'Device', mType: 'Asset', nodes: [] },
        { type: 'Device', mType: 'SimaticCp', nodes: [] },
        { type: 'Device', mType: 'Tag', nodes: [] },
        { type: 'Device', mType: 'Vehicle', nodes: [] },
      ],
    };
    return this.httpClient.post<Hierarchy>(`${this.basePath}/getAssets`, body);
  }

  public getAssetInfo(assetId: number) {
    const body = { refAsset: assetId };
    return this.httpClient.post<AssetInfo>(`${this.basePath}/getAssetInfo`, body);
  }

  public getAssetProperties(assetId: number) {
    const body = { refItem: assetId };
    return this.httpClient.post<AssetProperty[]>(`${this.basePath}/getVariables`, body);
  }

  public getAssetTimeSeries(assetId: number, propertyId: string, from: string, to: string, resolution: number) {
    const body = {
      refAsset: assetId,
      propertyPath: propertyId,
      from,
      to,
      resolution,
    };
    return this.httpClient.post<SiDriveIqTimeSeries[]>(`${this.basePath}/getTimeSeries`, body);
  }

  public getAssetValues(assetId: number, properties: string, size: number, from: string, to: string) {
    const params = { properties, size };
    return this.httpClient.get<AssetValue[]>(`${this.basePath}/assets/${assetId}/values`, { params });
  }

  public getRecentValuesforAssets(assetIds: number[], properties: string[], maxDateTime: string) {
    const body = {
      refAssets: assetIds,
      propertyPaths: properties,
      maxDateTime,
    };
    return this.httpClient.post<AssetPropertyValue[]>(`${this.basePath}/getRecentValuesforAssets`, body);
  }
}
