export interface Asset {
  id: string;
  type_id: string;
  name: string;
  description: string;
  tag: string;
  agent_id: string;
  is_active: boolean;
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
