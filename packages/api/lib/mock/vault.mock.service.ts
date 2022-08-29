import { DataMockService } from './data.mock.service';
import { VaultSecret } from '../vault.interface';
import { VaultService } from '../vault.service';

export class VaultMockService extends DataMockService<VaultSecret> implements VaultService {
  constructor(secrets: VaultSecret[]) {
    super();
    this.data = secrets;
  }

  public getSecret(name: string, version?: number): Promise<string> {
    const vaultSecret = this.data.find((v) => v.name === name);

    if (version && vaultSecret.version !== version) {
      return Promise.resolve('');
    }

    return Promise.resolve(vaultSecret.secret);
  }
}
