import { DataService } from './data.service';
import { VaultSecret } from './vault.interface';
import { HttpClient } from './http.service';

export class VaultService extends DataService<VaultSecret> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/vault/secrets');
  }

  public getSecret(name: string, version?: number): Promise<string> {
    const params = version ? { version } : {};
    return this.httpClient.get<string>(`${this.basePath}/${name}/secret`, { params });
  }
}
