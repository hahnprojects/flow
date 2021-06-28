import FormData from 'form-data';

import { Content, ContentInterface, ReturnType } from '../content.interface';
import { DataMockService } from './data.mock.service';
import { Readable } from 'stream';

export class ContentMockService extends DataMockService<Content> implements ContentInterface {
  private contentData: Map<string, any> = new Map();

  constructor(contents: Content[], contentData: any[]) {
    super();
    this.data = contents;
    for (let i = 0; i < contents.length; i++) {
      this.contentData.set(contents[i].id, contentData[i]);
    }
  }

  download(id: string, raw?: boolean): Promise<Blob | ArrayBuffer>;

  download(id: string, returnType: ReturnType.TEXT): Promise<string>;
  download(id: string, returnType: ReturnType.JSON): Promise<Record<string, unknown>>;
  download(id: string, returnType: ReturnType.NODEBUFFER): Promise<Buffer>;
  download(id: string, returnType: ReturnType.BLOB): Promise<Blob>;
  download(id: string, returnType: ReturnType.ARRAYBUFFER): Promise<ArrayBuffer>;
  download(id: string, returnType: ReturnType.NODESTREAM): Promise<Readable>;

  download(id: string, second: any): Promise<string | Record<string, unknown> | Buffer | Blob | ArrayBuffer | Readable> {
    let returnType: ReturnType;
    if (typeof second === 'boolean' || !second) {
      returnType = second ? ReturnType.ARRAYBUFFER : ReturnType.BLOB;
    } else {
      returnType = second;
    }
    const content = this.contentData.get(id);
    switch (returnType) {
      case ReturnType.TEXT:
        if (typeof content === 'string') {
          return Promise.resolve(content);
        } else {
          return Promise.resolve(JSON.stringify(content));
        }
      case ReturnType.JSON:
        if (typeof content !== 'string') {
          return Promise.resolve(content);
        } else {
          return Promise.resolve(JSON.parse(content));
        }
      case ReturnType.NODEBUFFER:
        return Promise.resolve(Buffer.from(this.contentData.get(id)));
      case ReturnType.BLOB:
        if (global.Blob) {
          return Promise.resolve(new Blob([Buffer.from(this.contentData.get(id)).buffer]));
        } else {
          if (typeof content === 'string') {
            return Promise.resolve(content);
          } else {
            return Promise.resolve(JSON.stringify(content));
          }
        }
      case ReturnType.ARRAYBUFFER:
        return Promise.resolve(Buffer.from(this.contentData.get(id)).buffer);
      case ReturnType.NODESTREAM:
        return Promise.resolve(Readable.from(this.contentData.get(id)));
    }
  }

  upload(form: FormData): Promise<Content> {
    return Promise.resolve(undefined);
  }
}
