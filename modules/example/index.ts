import { FlowModule } from '@hahnpro/flow-sdk';

import { DoNothing } from './src/DoNothing';
import { DoSomething } from './src/DoSomething';
import { ModifySomething } from './src/ModifySomething';

@FlowModule({
  name: 'example',
  declarations: [DoNothing, DoSomething, ModifySomething],
})
export default class ExampleModule {}
