import { Content } from './content.interface';
import { DataService } from './data.service';
import { HttpClient } from './http.service';

export class ContentService extends DataService<Content> {
  constructor(httpClient: HttpClient) {
    super(httpClient, 'api/contents');
  }

  download = (id: string): Promise<Blob> => {
    return this.httpClient.get<Blob>(`${this.basePath}/${id}/download`, { responseType: 'blob' });
  };
}
