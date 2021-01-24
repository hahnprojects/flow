import { HttpClient } from './http.service';
import { UserInterface } from './user.interface';
import jwtDecode from 'jwt-decode';

export class UserService implements UserInterface {
  constructor(private httpClient: HttpClient) {}

  async getCurrentUserRoles(): Promise<string[]> {
    try {
      const token = await this.httpClient.getAccessToken();
      const decode = jwtDecode(token) as { realm_access: { roles: string[] } };
      return decode.realm_access.roles;
    } catch (err) {
      return null;
    }
  }
}
