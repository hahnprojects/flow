import { Paginated, RequestParameter } from '../data.interface';
import { TimeSeries, TimeSeriesValue, TS_GROUPS } from '../timeseries.interface';
import { DataMockService } from './data.mock.service';
import { TrashMockService } from './trash.mock.service';
import { mix, settings } from 'ts-mixer';

settings.initFunction = 'initMock';

interface MixedClass
  extends DataMockService<TimeSeries & { data: TimeSeriesValue[] }>,
    TrashMockService<TimeSeries & { data: TimeSeriesValue[] }> {}

@mix(DataMockService, TrashMockService)
class MixedClass {}

export class TimeseriesMockService extends MixedClass {
  constructor(timeseries: TimeSeries[], timeseriesValues: TimeSeriesValue[][]) {
    super();
    this.initMock(timeseries, timeseriesValues);
    this.data = timeseries.map((value, index) => ({ ...value, data: timeseriesValues[index] }));
  }

  public initMock(timeseries: TimeSeries[], timeseriesValues: TimeSeriesValue[][]) {
    this.initData(null, null);
    this.initTrash(null, null, timeseries, this.deleteOne);
  }

  deleteOne(tsmId: string, force = false): Promise<TimeSeries> {
    const tsm = this.data.find((v) => v.id === tsmId);
    if (!tsm?.deletedAt && !force) {
      // put tsm in paper bin by setting deletedAt prop
      tsm.deletedAt = new Date().toISOString();
      return Promise.resolve(tsm);
    }
    return super.deleteOne(tsmId);
  }

  getMany(params?: RequestParameter): Promise<Paginated<(TimeSeries & { data: TimeSeriesValue[] })[]>> {
    const page = this.getItems(params, false);
    return Promise.resolve(page);
  }

  addAssetTimeSeriesValues(
    assetId: string,
    name: string,
    readPermissions: string[],
    readWritePermissions: string[],
    values: { [p: string]: any },
  ): Promise<TimeSeries> {
    const ts = this.data.find((v) => v.assetRef === assetId);
    if (!ts) {
      const data = values.map((v) => ({ timestamp: Date.now(), ...v }));
      const dto: TimeSeries & { data: TimeSeriesValue[] } = {
        autoDelBucket: undefined,
        autoDelData: undefined,
        description: '',
        maxBucketTimeRange: 0,
        minDate: undefined,
        name,
        readPermissions,
        readWritePermissions,
        assetRef: assetId,
        data,
      };
      return this.addOne(dto);
    }
    ts.data = { ...ts.data, ...values };
    return Promise.resolve(ts);
  }

  async addValue(id: string, value: { [p: string]: any }): Promise<void> {
    const ts = await this.getOne(id, {});
    ts.data.push({ timestamp: new Date().valueOf(), value });
    return;
  }

  getManyByAsset(assetId: string, names?: string[]): Promise<Paginated<TimeSeries[]>> {
    // get timeseries where assetRef is assetId
    const page: Paginated<TimeSeries[]> = { docs: [], limit: 10, total: 0 };
    for (const datum of this.data) {
      if (datum.assetRef === assetId) {
        page.docs.push(datum);
      }
      if (page.docs.length === page.limit) {
        break;
      }
    }
    page.total = page.docs.length;
    return Promise.resolve(page);
  }

  async getMostRecentValue(id: string, before: Date): Promise<TimeSeriesValue> {
    const ts = await this.getOne(id, {});
    for (const datum of ts.data) {
      if (datum.timestamp < before.valueOf()) {
        return datum;
      }
    }
  }

  async getValues(id: string, from: number, limit?: number, group?: TS_GROUPS): Promise<TimeSeriesValue[]> {
    let timeSeriesValues: TimeSeriesValue[] = await this.getValuesOfPeriod(id, from, new Date().valueOf(), group);
    if (limit) {
      timeSeriesValues = timeSeriesValues.slice(0, limit);
    }
    return timeSeriesValues;
  }

  async getValuesOfPeriod(id: string, from: number, to: number, group?: TS_GROUPS): Promise<TimeSeriesValue[]> {
    const ts = await this.getOne(id, {});
    return ts.data.filter((v) => v.timestamp < to && v.timestamp > from);
  }
}
