export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  defaultValue?: any;
  isPrimary?: boolean;
  isUnique?: boolean;
  isIndexed?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
}

export interface ForeignKeyDefinition {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  isUnique?: boolean;
  type?: 'BTREE' | 'HASH' | 'GIST' | 'GIN';
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  primaryKey?: string[];
  foreignKeys?: ForeignKeyDefinition[];
  indices?: IndexDefinition[];
  options?: {
    engine?: string;
    charset?: string;
    collate?: string;
    comment?: string;
  };
} 