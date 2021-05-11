import { DataInterface } from './data.interface';

export interface Event {
  id?: string;
  name: string;
  description?: string;
  tags?: string[];
  readPermissions: string[];
  readWritePermissions: string[];
  assetRef?: string;
  alertRef?: string;
  tsRef?: string;
  eventRef?: string;
  cause: string;
  level: string;
}

export type EventsInterface = DataInterface<Event>;
