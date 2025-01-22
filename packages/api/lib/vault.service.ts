import { DataService } from './data.service';
import { VaultSecret } from './vault.interface';
import { HttpClient, TokenOption } from './http.service';

export class VaultService extends DataService<VaultSecret> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/vault/secrets');
  }

  public getSecret(name: string, version?: number, options: TokenOption = {}): Promise<string> {
    const params = version ? { version } : {};
    return this.httpClient.get<string>(`${this.basePath}/${name}/secret`, { params, ...options });
  }
}
