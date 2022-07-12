export interface UserSettings {
  userId: string;
  language: string;
  activeRoles: Permission[];
  creationReadRoles: Permission[];
  creationWriteRoles: Permission[];
  activeTags: string[];
  applications: Application[];
  tableSettings: TableSetting[];
  favoriteLabelsOrder: Record<string, number>
}

export interface Application {
  name: string;
  currentColumnSettings?: string;
  columnSettings?: string[];
}

export interface Permission {
  label: string;
  value: string;
}

export interface TableSettingProfile {
  name: string;
  cols: string;
}

export interface TableSetting {
  name: string;
  currentProfile: string;
  profiles: TableSettingProfile[];
}