import FormData from 'form-data';
import { Readable } from 'stream';
import { mix } from 'ts-mixer';

import { APIBase } from './api-base';
import { Content, ReturnType } from './content.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { TrashService } from './trash.service';

interface BaseService extends DataService<Content>, TrashService<Content> {}
@mix(DataService, TrashService)
class BaseService extends APIBase {}

export class ContentService extends BaseService {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/contents');
  }

  upload = (form: FormData): Promise<Content> => {
    const headers = { ...form.getHeaders() };
    return this.httpClient.post<Content>(`${this.basePath}`, form, { headers, maxBodyLength: Infinity, maxContentLength: Infinity });
  };

  download(id: string, raw?: boolean): Promise<Blob | ArrayBuffer>;

  download(id: string, returnType: ReturnType.TEXT): Promise<string>;
  download(id: string, returnType: ReturnType.JSON): Promise<Record<string, unknown>>;
  download(id: string, returnType: ReturnType.NODEBUFFER): Promise<Buffer>;
  download(id: string, returnType: ReturnType.BLOB): Promise<Blob>;
  download(id: string, returnType: ReturnType.ARRAYBUFFER): Promise<ArrayBuffer>;
  download(id: string, returnType: ReturnType.NODESTREAM): Promise<Readable>;

  async download(id: string, second: any): Promise<string | Record<string, unknown> | Buffer | Blob | ArrayBuffer | Readable> {
    let returnType: ReturnType;
    if (typeof second === 'boolean' || second == null) {
      returnType = second ? ReturnType.ARRAYBUFFER : ReturnType.BLOB;
    } else {
      returnType = second;
    }

    const url = `${this.basePath}/${id}/download`;
    switch (returnType) {
      case ReturnType.TEXT:
        return this.httpClient.get<string>(url, { responseType: 'text' });
      case ReturnType.JSON:
        return this.httpClient.get<Record<string, unknown>>(url, { responseType: 'json' });
      case ReturnType.NODEBUFFER:
        return Buffer.from(new Uint8Array(await this.httpClient.get<ArrayBuffer>(url, { responseType: 'arraybuffer' })));
      case ReturnType.BLOB:
        return this.httpClient.get<Blob>(url, { responseType: 'blob' });
      case ReturnType.ARRAYBUFFER:
        return this.httpClient.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
      case ReturnType.NODESTREAM:
        return this.httpClient.get<Readable>(url, { responseType: 'stream' });
    }
  }
}
