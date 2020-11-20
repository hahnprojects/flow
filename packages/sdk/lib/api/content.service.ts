import FormData from 'form-data';

import { Content, ContentInterface } from './content.interface';
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
}
