export enum DatabaseType {
  MYSQL = 'mysql',
  POSTGRESQL = 'postgres',
  SQLITE = 'sqlite',
  MSSQL = 'mssql',
  MONGODB = 'mongodb'
}

export interface DatabaseConnectionOptions {
  type: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: {
    enabled: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
}

export interface DatabaseClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any>;
  getTables(): Promise<string[]>;
  getColumns(tableName: string): Promise<any[]>;
  getIndexes(tableName: string): Promise<any[]>;
  getForeignKeys(tableName: string): Promise<any[]>;
  executeTransaction(queries: string[]): Promise<void>;
}

export interface DatabaseMetadata {
  tables: string[];
  columns: { [tableName: string]: any[] };
  indexes: { [tableName: string]: any[] };
  foreignKeys: { [tableName: string]: any[] };
} 