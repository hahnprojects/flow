import { DataService } from './data.service';
import { FlowModule } from './flow-module.interface';
import { HttpClient } from './http.service';
import FormData from 'form-data';

export class FlowModuleService extends DataService<FlowModule> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/flow/modules');
  }

  public deleteArtifact(name: string, version: string): Promise<FlowModule> {
    return this.httpClient.delete<FlowModule>(`${this.basePath}/${name}/${version}`);
  }

  public publish(form: FormData) {
    const config = {
      headers: { ...form.getHeaders() },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    };

    return this.httpClient.post(`${this.basePath}`, form, config);
  }

  public addOne(_dto: any): Promise<FlowModule> {
    throw new Error('not allowed: use publish instead');
  }

  public addMany(_dto: any[]): Promise<FlowModule[]> {
    throw new Error('not allowed: use publish instead');
  }
}
