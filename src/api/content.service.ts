import FormData from 'form-data';

import { Content } from './content.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';

export class ContentService extends DataService<Content> {
  constructor(httpClient: HttpClient) {
    super(httpClient, 'api/contents');
  }

  upload = (form: FormData): Promise<Content> => {
    const headers = { ...form.getHeaders() };
    return this.httpClient.post<Content>(`${this.basePath}`, form, { headers, maxContentLength: Infinity });
  };

  download = (id: string, raw: boolean = false): Promise<Blob | ArrayBuffer> => {
    if (raw) {
      return this.httpClient.get<ArrayBuffer>(`${this.basePath}/${id}/download`, { responseType: 'arraybuffer' });
    } else {
      return this.httpClient.get<Blob>(`${this.basePath}/${id}/download`, { responseType: 'blob' });
    }
  };
}
