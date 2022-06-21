import { DataMockService } from './data.mock.service';
import { Label } from '../label.interface';
import { LabelService } from '../label.service';

export class LabelMockService extends DataMockService<Label> implements LabelService {
  constructor(labels: Label[]) {
    super();
    this.data = labels;
  }

  count(): Promise<number> {
    return Promise.resolve(this.data.length);
  }

  getOneByName(name: string): Promise<Label> {
    return Promise.resolve(this.data.find((label) => label.name === name));
  }
}
