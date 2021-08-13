import * as dotenv from 'dotenv';

import { API } from '../lib';

dotenv.config();

/* tslint:disable:no-console */
describe('SiDriveIQ API', () => {
  const api = new API();

  test('FLOW.SID.1 sidrive', () => {
    // const assets = await api.siDriveIq.getAssetCount().catch((err) => logError(err));
    // expect(assets).toBeDefined();
    // const prop = await api.siDriveIq.getProperty(3100, 'SCS.TRAIR1I.TDt').catch((err) => logError(err));
    // expect(prop).toBeDefined();
    // console.log(prop);
    // const tsc = await api.siDriveIq.getRecentTimeSeries(3100, 'SCS.TRAIR1I.TDt').catch((err) => logError(err));
    // expect(tsc).toBeDefined();
    // console.log(tsc);
    // const subs = await api.siDriveIq.getSubsets(3100).catch((err) => logError(err));
    // expect(subs).toBeDefined();
    // console.log(subs);
    // const props = await api.siDriveIq.getSubsetProperties(3100, '13').catch((err) => logError(err));
    // expect(props).toBeDefined();
    // console.log(props);
    // const props2 = await api.siDriveIq.getProperties(3100, 'TRAIR1', 'SCS').catch((err) => logError(err));
    // expect(props2).toBeDefined();
    // console.log(props2);
  });
});

function logError(err: any) {
  if (err && err.response) {
    console.error(err.response.data);
  } else {
    console.error(err);
  }
}
