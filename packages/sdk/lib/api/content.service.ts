import FormData from 'form-data';

import { Content, ContentInterface, ReturnType } from './content.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';

export class ContentService extends DataService<Content> implements ContentInterface {
  constructor(httpClient: HttpClient) {
    super(httpClient, process.env.DEBUG_CONTENT_URL || 'api/contents');
  }

  upload = (form: FormData): Promise<Content> => {
    const headers = { ...form.getHeaders() };
    return this.httpClient.post<Content>(`${this.basePath}`, form, { headers, maxBodyLength: Infinity, maxContentLength: Infinity });
  };

  download = (id: string, raw = false): Promise<Blob | ArrayBuffer> => {
    if (raw) {
      return this.httpClient.get<ArrayBuffer>(`${this.basePath}/${id}/download`, { responseType: 'arraybuffer' });
    } else {
      return this.httpClient.get<Blob>(`${this.basePath}/${id}/download`, { responseType: 'blob' });
    }
  };

  async download2(id: string, returnType: ReturnType): Promise<string | Record<string, unknown> | Buffer | Blob | ArrayBuffer> {
    switch (returnType) {
      case ReturnType.JSON:
        return this.httpClient.get<string>(`${this.basePath}/${id}/download`, { responseType: 'json' });
      case ReturnType.PARSEDJSON:
        return JSON.parse(await this.httpClient.get<string>(`${this.basePath}/${id}/download`, { responseType: 'json' }));
      case ReturnType.NODEBUFFER:
        return Buffer.from(
          new Uint8Array(await this.httpClient.get<ArrayBuffer>(`${this.basePath}/${id}/download`, { responseType: 'arraybuffer' })),
        );
      case ReturnType.BLOB:
        return this.httpClient.get<Blob>(`${this.basePath}/${id}/download`, { responseType: 'blob' });
      case ReturnType.ARRAYBUFFER:
        return this.httpClient.get<ArrayBuffer>(`${this.basePath}/${id}/download`, { responseType: 'arraybuffer' });
    }
  }
}
