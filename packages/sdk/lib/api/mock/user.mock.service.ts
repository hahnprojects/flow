import { UserInterface } from '../user.interface';
import { UserInit } from './api.mock';

export class UserMockService implements UserInterface {
  constructor(private users: UserInit) {}

  getCurrentUserRoles(): Promise<string[]> {
    return Promise.resolve(this.users.roles);
  }
}