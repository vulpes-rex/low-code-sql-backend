import { Pool as MySQLPool } from 'mysql2/promise';
import { ConnectionPool as SQLServerPool } from 'mssql';
import { Pool as PgPool } from 'pg';
import { MongoClient } from 'mongodb';
import { QueryResult as MySQLQueryResult } from 'mysql2';
import { IResult } from 'mssql';
import { QueryResult as PgQueryResult } from 'pg';

// Database client types
export type MySQLClient = MySQLPool;
export type SQLServerClient = SQLServerPool;
export type PostgreSQLClient = PgPool;
export type MongoDBClient = MongoClient;

// Union type for all database clients
export type DatabaseClient = MySQLClient | SQLServerClient | PostgreSQLClient | MongoDBClient;

// Type guards for database clients
export function isMySQLClient(client: DatabaseClient): client is MySQLClient {
  return 'execute' in client && 'query' in client;
}

export function isSQLServerClient(client: DatabaseClient): client is SQLServerClient {
  return 'request' in client && 'connect' in client;
}

export function isPostgreSQLClient(client: DatabaseClient): client is PostgreSQLClient {
  return 'query' in client && !('execute' in client) && !('request' in client);
}

export function isMongoDBClient(client: DatabaseClient): client is MongoDBClient {
  return 'db' in client && 'connect' in client;
}

// Query result types
export interface MySQLQueryResultType {
  rows: any[];
  rowCount?: number;
  fields?: any[];
}

export interface SQLServerQueryResultType {
  recordset: any[];
  rowsAffected: number[];
}

export interface PostgreSQLQueryResultType {
  rows: any[];
  rowCount: number;
  fields: any[];
}

export interface MongoDBQueryResultType {
  result: any;
  ok: number;
}

export type QueryResultType = 
  | MySQLQueryResultType 
  | SQLServerQueryResultType 
  | PostgreSQLQueryResultType 
  | MongoDBQueryResultType;

// Database configuration types
export interface DatabaseClientConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  sslOptions?: {
    rejectUnauthorized?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  poolSize?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
}

// Database type enum
export enum DatabaseType {
  MYSQL = 'mysql',
  SQLSERVER = 'sqlserver',
  POSTGRESQL = 'postgresql',
  MONGODB = 'mongodb'
}

// Connection pool options
export interface ConnectionPoolOptions {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  destroyTimeoutMillis?: number;
  reapIntervalMillis?: number;
  createRetryIntervalMillis?: number;
}

// Query execution options
export interface QueryExecutionOptions {
  timeout?: number;
  transaction?: boolean;
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
}

// Database metadata types
export interface DatabaseMetadata {
  version: string;
  schemas: string[];
  tables: string[];
  views: string[];
  functions: string[];
  procedures: string[];
}

// Table metadata types
export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isForeignKey?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export interface TableMetadata {
  name: string;
  schema: string;
  columns: ColumnMetadata[];
  primaryKey?: string[];
  foreignKeys?: {
    name: string;
    columns: string[];
    referencedTable: string;
    referencedColumns: string[];
  }[];
  indexes?: {
    name: string;
    columns: string[];
    isUnique: boolean;
  }[];
}

// Error types
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, 'CONNECTION_ERROR', originalError);
    this.name = 'ConnectionError';
  }
}

export class QueryError extends DatabaseError {
  constructor(message: string, originalError?: Error) {
    super(message, 'QUERY_ERROR', originalError);
    this.name = 'QueryError';
  }
}

// Utility types
export type QueryParams = any[] | { [key: string]: any };

export interface QueryOptions {
  params?: QueryParams;
  timeout?: number;
  transaction?: boolean;
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
} 