import FormData from 'form-data';

import { Content, ContentInterface, ReturnType } from './content.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Readable } from 'stream';

export class ContentService extends DataService<Content> implements ContentInterface {
  constructor(httpClient: HttpClient) {
    super(httpClient, process.env.DEBUG_CONTENT_URL || 'api/contents');
  }

  upload = (form: FormData): Promise<Content> => {
    const headers = { ...form.getHeaders() };
    return this.httpClient.post<Content>(`${this.basePath}`, form, { headers, maxBodyLength: Infinity, maxContentLength: Infinity });
  };

  async download(id: string, raw?: boolean): Promise<Blob | ArrayBuffer>;

  async download(id: string, returnType: ReturnType): Promise<string | Record<string, unknown> | Buffer | Blob | ArrayBuffer | Readable>;

  async download(id: string, second: any): Promise<string | Record<string, unknown> | Buffer | Blob | ArrayBuffer | Readable> {
    let returnType: ReturnType;
    if (typeof second === 'boolean' || !second) {
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
