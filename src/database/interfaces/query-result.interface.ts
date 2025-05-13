export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields: Array<{ name: string }>;
  affectedRows?: number;
  command?: string;
  oid?: number;
  rowAsArray?: boolean;
} 