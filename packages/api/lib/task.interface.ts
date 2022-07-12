export interface Task {
  id: string;
  name: string;
  desc?: string;
  tags?: string[];
  author?: string;
  readPermissions: string[];
  readWritePermissions: string[];
  assetRef?: string;
  eventRef?: string;
  expiryDate?: Date;
  parent?: string;
  subTasks?: string[];
  assignedTo: string[];
  status?: string;
  acceptedBy?: string;
  rejectReason?: string;
  statusHistoryLog?: string[];
  weight?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
