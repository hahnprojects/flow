export interface Asset {
  id: string;
  type_id: string;
  name: string;
  description: string;
  tag: string;
  agent_id: string;
  is_active: boolean;
}

export interface File {
  id: string;
  name: string;
  status: string;
  content_type: string;
  created_at: string;
  length: number;
}

export interface List<T> {
  cursor: string;
  values: T[];
}

export interface Log {
  ref_id: string;
  ref_type: RefType;
  severity: Severity;
  created_at: string;
  text: string;
  actor: string;
  category: string;
  item_type: string;
  gone_at: string;
}

export interface Mail {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  is_html: boolean;
}

export interface Property {
  path: string;
  name: string;
  unit: string;
  data_type: string;
  is_mandatory: boolean;
}

export type RefType = 'Unknown' | 'Asset' | 'AssetType' | 'Container' | 'ContainerType' | 'Action' | 'AssetReport' | 'ReportType';

export type Severity = 'Info' | 'Warning' | 'Error' | 'All';

export interface Subset {
  id: string;
  name: string;
}

export interface TimeSeries {
  ts: string;
  v: any;
}

export interface RangeParams {
  from?: string | Date;
  to?: string | Date;
}

export interface CursorParams {
  limit?: number;
  cursor?: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  sort?: string;
}

export interface AssetsParams extends CursorParams {
  name_filter?: string;
  type_filter?: string;
  tag_filter?: string;
  agent_filter?: string;
}

export interface PropertiesParams extends CursorParams {
  path_filter?: string;
  subset_filter?: string;
  only_assigned?: boolean;
  only_mandatory?: boolean;
}

export interface TimeSeriesParams extends CursorParams, RangeParams {}

export interface FilesCountParams extends RangeParams {
  name_filter?: string;
  status_filter?: 'Imported' | 'Scanned' | 'ScannedButEmpty';
  exclude?: string;
}

export interface FilesParams extends FilesCountParams, PaginationParams {}

export interface LogsParams extends PaginationParams, RangeParams {
  categories: string[];
  severity?: Severity;
  filter?: string;
}

export interface LogDto {
  text: string;
  severity: Severity;
  created_at: string;
  actor: string;
  category: string;
  gone_at: string;
}
