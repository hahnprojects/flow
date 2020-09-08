import FormData from 'form-data';

import { Content, ContentInterface } from '../content.interface';
import { DataMockService } from './data.mock.service';

export class ContentMockService extends DataMockService<Content> implements ContentInterface {
  private contentData: Map<string, any> = new Map();

  constructor(contents: Content[], contentData: any[]) {
    super();
    this.data = contents;
    for (let i = 0; i < contents.length; i++) {
      this.contentData.set(contents[i].id, contentData[i]);
    }
  }

  download(id: string, raw: boolean): Promise<Blob | ArrayBuffer> {
    return Promise.resolve(Buffer.from(this.contentData.get(id)).buffer);
  }

  upload(form: FormData): Promise<Content> {
    return Promise.resolve(undefined);
  }
}
