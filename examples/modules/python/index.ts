import { FlowModule } from '@hahnpro/flow-sdk';
import { Python } from './src/PythonShell';
import { PythonRPC } from './src/PythonRPC';

@FlowModule({
  name: 'python',
  declarations: [Python, PythonRPC],
})
export default class PythonModule {}
