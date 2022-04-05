import { DataService } from './data.service';
import { FlowModule } from './flow-module.interface';
import { HttpClient } from './http.service';
import { createWriteStream, ReadStream } from 'fs';
import FormData from 'form-data';
import { finished } from 'stream/promises';

export class FlowModuleService extends DataService<FlowModule> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/flow/modules');
  }

  public deleteArtifact(name: string, version: string): Promise<FlowModule> {
    return this.httpClient.delete<FlowModule>(`${this.basePath}/${name}/${version}`);
  }

  public async download(name: string, filePath: string, version = 'latest') {
    const writer = createWriteStream(filePath);
    return this.httpClient.get(`${this.basePath}/${name}/${version}`, { responseType: 'stream' }).then(async (response: ReadStream) => {
      response.pipe(writer);
      return finished(writer);
    });
  }

  public publish(file: ReadStream) {
    const form = new FormData();
    form.append('file', file);

    const config = {
      headers: { ...form.getHeaders() },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    };

    return this.httpClient.post(`${this.basePath}`, form, config);
  }

  public addOne(dto: any): Promise<FlowModule> {
    throw new Error('not allowed: use publish instead');
  }

  public addMany(dto: any[]): Promise<FlowModule[]> {
    throw new Error('not allowed: use publish instead');
  }
}
