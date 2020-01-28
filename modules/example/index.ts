import { FlowModule } from '@hahnpro/flow-sdk';

import { DoNothing } from './src/DoNothing';

@FlowModule({
  name: 'example',
  declarations: [DoNothing],
})
export default class ExampleModule {}
