import { DataService } from './data.service';
import { HttpClient, TokenOption } from './http.service';
import { Label } from './label.interface';

export class LabelService extends DataService<Label> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/labels');
  }

  public addMany(dtos: Label[], options: TokenOption = {}): Promise<Label[]> {
    return Promise.all(dtos.map((dto) => this.addOne(dto, options)));
  }

  public getOneByName(name: string, options: TokenOption = {}): Promise<Label> {
    return this.httpClient.get(`${this.basePath}/name/${name}`, options);
  }

  public count(options: TokenOption = {}): Promise<number> {
    return this.httpClient.get(`${this.basePath}/count`, options);
  }
}
