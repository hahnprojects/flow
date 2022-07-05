import FormData from 'form-data';
import { Readable } from 'stream';

import { Content, ReturnType } from '../content.interface';
import { DataMockService } from './data.mock.service';
import { TrashMockService } from './trash.mock.service';
import { mix, settings } from 'ts-mixer';
import { Paginated, RequestParameter } from '../data.interface';

settings.initFunction = 'initMock';

interface MixedClass extends DataMockService<Content>, TrashMockService<Content> {}

@mix(DataMockService, TrashMockService)
class MixedClass {}

export class ContentMockService extends MixedClass {
  private contentData: Map<string, any> = new Map();

  constructor(contents: Content[], contentData: any[]) {
    super();
    this.data = contents;
    for (let i = 0; i < contents.length; i++) {
      this.contentData.set(contents[i].id, contentData[i]);
    }
    this.initMock(contents, contentData);
  }

  public initMock(contents: Content[], contentData: any[]) {
    this.data = contents;
    this.initData(null, null);
    this.initTrash(null, null, contents, this.deleteOne);
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
    if (typeof second === 'boolean' || second == null) {
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

  deleteOne(contentId: string, force = false): Promise<Content> {
    const content = this.data.find((v) => v.id === contentId);
    if (!content?.deletedAt && !force) {
      // put content in paper bin by setting deletedAt prop
      content.deletedAt = new Date().toISOString();
      return Promise.resolve(content);
    }
    return super.deleteOne(contentId);
  }

  getMany(params?: RequestParameter): Promise<Paginated<Content[]>> {
    const page = this.getItems(params, false);
    return Promise.resolve(page);
  }

  upload(form: FormData): Promise<Content> {
    return Promise.resolve(undefined);
  }
}
