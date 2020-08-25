import FormData from 'form-data';
import * as fs from 'fs';

import { Content, ContentInterface } from '../content.interface';
import { DataMockService } from './data.mock.service';

export class ContentMockService extends DataMockService<Content> implements ContentInterface {
  constructor(contents: Content[]) {
    super();
    this.data = contents;
  }

  download(id: string, raw: boolean): Promise<Blob | ArrayBuffer> {
    const content = this.data.find((v) => v.id === id);
    const buffer = fs.readFileSync(content.filename);
    return Promise.resolve(buffer);
  }

  upload(form: FormData): Promise<Content> {
    return Promise.resolve(undefined);
  }
}
