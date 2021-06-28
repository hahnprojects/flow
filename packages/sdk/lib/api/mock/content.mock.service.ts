import FormData from 'form-data';

import { Content, ContentInterface, ReturnType } from '../content.interface';
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
    if (raw) {
      return Promise.resolve(Buffer.from(this.contentData.get(id)).buffer);
    } else {
      return Promise.resolve(this.contentData.get(id).toString());
    }
  }

  download2(id: string, returnType: ReturnType): Promise<string | Record<string, unknown> | Buffer | Blob | ArrayBuffer> {
    const content = this.contentData.get(id);
    switch (returnType) {
      case ReturnType.JSON:
        if (typeof content === 'string') {
          return Promise.resolve(content);
        } else {
          return Promise.resolve(JSON.stringify(content));
        }
      case ReturnType.PARSEDJSON:
        if (typeof content !== 'string') {
          return Promise.resolve(content);
        } else {
          return Promise.resolve(JSON.parse(content));
        }
      case ReturnType.NODEBUFFER:
        return Promise.resolve(Buffer.from(this.contentData.get(id)));
      case ReturnType.BLOB:
        return Promise.resolve(new Blob([Buffer.from(this.contentData.get(id)).buffer]));
      case ReturnType.ARRAYBUFFER:
        return Promise.resolve(Buffer.from(this.contentData.get(id)).buffer);
    }
  }

  upload(form: FormData): Promise<Content> {
    return Promise.resolve(undefined);
  }
}
