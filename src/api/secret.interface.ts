import { DataInterface } from './data.interface';

export interface Secret {
  id?: string;
  name: string;
  key: string;
  readPermissions: string[];
  readWritePermissions: string[];
}

export interface SecretInterface extends DataInterface<Secret> {

}