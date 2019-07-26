import { BaseService } from './base.service';
import { Content } from './content.interface';
import { HttpClient } from './http.service';

export class ContentService extends BaseService<Content> {
  constructor(httpClient: HttpClient) {
    super(httpClient, 'api/contents');
  }

  getContent = (id: string): Promise<Blob> => {
    return this.httpClient.get<Blob>(`${this.basePath}/${id}/download`, { responseType: 'blob' as 'json' });
  };
}
