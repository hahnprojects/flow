import { FlowModule } from '@hahnpro/flow-sdk';
import { Python } from './src/PythonShell';

@FlowModule({
  name: 'python',
  declarations: [Python],
})
export default class PythonModule {}
