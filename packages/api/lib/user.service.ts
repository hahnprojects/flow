import { HttpClient } from './http.service';
import jwtDecode from 'jwt-decode';
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

  public getUserSettings(): Promise<UserSettings> {
    return this.httpClient.get(this.basePath);
  }

  public updateUserSettings(settings: UserSettings): Promise<UserSettings> {
    return this.httpClient.put(this.basePath, settings);
  }

  public deleteUserSettings(): Promise<UserSettings> {
    return this.httpClient.delete(this.basePath);
  }
}
