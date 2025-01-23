import { jwtDecode } from 'jwt-decode';

import { HttpClient, TokenOption } from './http.service';
import { UserSettings } from './user-settings.interface';

export class UserService {
  private readonly basePath: string;
  constructor(private httpClient: HttpClient) {
    this.basePath = '/user';
  }

  async getCurrentUserRoles(): Promise<string[]> {
    try {
      const token = await this.httpClient.getAccessToken();
      const decode = jwtDecode(token) as { realm_access: { roles: string[] } };
      return decode.realm_access.roles;
    } catch (err) {
      return null;
    }
  }

  public getUserSettings(options: TokenOption = {}): Promise<UserSettings> {
    return this.httpClient.get(this.basePath, options);
  }

  public updateUserSettings(settings: UserSettings, options: TokenOption = {}): Promise<UserSettings> {
    return this.httpClient.put(this.basePath, settings, options);
  }

  public deleteUserSettings(options: TokenOption = {}): Promise<UserSettings> {
    return this.httpClient.delete(this.basePath, options);
  }
}
