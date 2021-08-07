import { FlowEvent } from '@hahnpro/flow-sdk';

import { DoNothing } from './DoNothing';

/* tslint:disable:no-console */
describe('Simple', () => {
  test('simple test', async () => {
    const nothingHappens = new DoNothing({ id: 'nothing' }, { logData: false });

    const event = await nothingHappens.noop(new FlowEvent({ id: 'trigger' }, { foo: 'bar' }));
    const data = event.getData();
    expect(data).toBeDefined();
    expect(data.foo).toEqual('bar');
  });
});
