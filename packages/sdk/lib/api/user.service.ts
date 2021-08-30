import { HttpClient } from './http.service';
import jwtDecode from 'jwt-decode';

export class UserService {
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
