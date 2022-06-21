import { DataService } from './data.service';
import { HttpClient } from './http.service';
import { Label } from './label.interface';

export class LabelService extends DataService<Label> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/labels');
  }

  public addMany(dtos: Label[]): Promise<Label[]> {
    return Promise.all(dtos.map((dto) => this.addOne(dto)));
  }

  public getOneByName(name: string): Promise<Label> {
    return this.httpClient.get(`${this.basePath}/name/${name}`);
  }

  public count(): Promise<number> {
    return this.httpClient.get(`${this.basePath}/count`);
  }
}
