import { UserService } from '../user.service';
import { UserInit } from './api.mock';

export class UserMockService extends UserService {
  constructor(private users: UserInit) {
    super(null);
  }

  getCurrentUserRoles(): Promise<string[]> {
    return Promise.resolve(this.users.roles);
  }
}
