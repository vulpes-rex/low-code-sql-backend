import { Injectable } from '@nestjs/common';
import * as sql from 'mssql';
import { DatabaseClient, DatabaseConnectionOptions } from '../types/database-clients.types';

@Injectable()
export class MSSQLClient implements DatabaseClient {
  private pool: sql.ConnectionPool;

  constructor(private readonly options: DatabaseConnectionOptions) {
    this.pool = new sql.ConnectionPool({
      server: options.host,
      port: options.port,
      user: options.username,
      password: options.password,
      database: options.database,
      options: {
        encrypt: options.ssl?.enabled || false,
        trustServerCertificate: !options.ssl?.enabled
      }
    });
  }

  async connect(): Promise<void> {
    await this.pool.connect();
  }

  async disconnect(): Promise<void> {
    await this.pool.close();
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const request = this.pool.request();
    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }
    const result = await request.query(sql);
    return result.recordset;
  }

  async getTables(): Promise<string[]> {
    const result = await this.query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_SCHEMA = 'dbo'
    `);
    return result.map(row => row.TABLE_NAME);
  }

  async getColumns(tableName: string): Promise<any[]> {
    const result = await this.query(`
      SELECT 
        COLUMN_NAME as column_name,
        DATA_TYPE as data_type,
        IS_NULLABLE as is_nullable,
        COLUMN_DEFAULT as column_default,
        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as is_primary
      FROM INFORMATION_SCHEMA.COLUMNS c
      LEFT JOIN (
        SELECT ku.COLUMN_NAME
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
        JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
          ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
        AND ku.TABLE_NAME = @tableName
      ) pk ON c.COLUMN_NAME = pk.COLUMN_NAME
      WHERE c.TABLE_NAME = @tableName
    `, [tableName]);
    return result;
  }

  async getIndexes(tableName: string): Promise<any[]> {
    const result = await this.query(`
      SELECT 
        i.name as index_name,
        i.is_unique as is_unique,
        STRING_AGG(c.name, ',') as columns
      FROM sys.indexes i
      JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.object_id = OBJECT_ID(@tableName)
      GROUP BY i.name, i.is_unique
    `, [tableName]);
    return result.map(row => ({
      ...row,
      columns: row.columns.split(',')
    }));
  }

  async getForeignKeys(tableName: string): Promise<any[]> {
    const result = await this.query(`
      SELECT 
        fk.name as constraint_name,
        COL_NAME(fc.parent_object_id, fc.parent_column_id) as column_name,
        OBJECT_NAME(fc.referenced_object_id) as referenced_table_name,
        COL_NAME(fc.referenced_object_id, fc.referenced_column_id) as referenced_column_name
      FROM sys.foreign_keys fk
      JOIN sys.foreign_key_columns fc ON fk.object_id = fc.constraint_object_id
      WHERE fk.parent_object_id = OBJECT_ID(@tableName)
    `, [tableName]);
    return result;
  }

  async executeTransaction(queries: string[]): Promise<void> {
    const transaction = this.pool.transaction();
    try {
      await transaction.begin();
      for (const query of queries) {
        await transaction.request().query(query);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
} 