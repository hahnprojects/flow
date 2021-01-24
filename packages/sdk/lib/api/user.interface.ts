export interface UserInterface {
  getCurrentUserRoles(): Promise<string[]>;
}
