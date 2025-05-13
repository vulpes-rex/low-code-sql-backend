import { Injectable } from '@nestjs/common';
import { createPool, Pool, PoolConnection } from 'mysql2/promise';
import { DatabaseClient, DatabaseConnectionOptions } from '../types/database-clients.types';

@Injectable()
export class MySQLClient implements DatabaseClient {
  private pool: Pool;

  constructor(private readonly options: DatabaseConnectionOptions) {
    this.pool = createPool({
      host: options.host,
      port: options.port,
      user: options.username,
      password: options.password,
      database: options.database,
      ssl: options.ssl ? {
        rejectUnauthorized: false
      } : undefined
    });
  }

  async connect(): Promise<void> {
    await this.pool.getConnection();
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }

  async getTables(): Promise<string[]> {
    const [rows] = await this.pool.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
      [this.options.database]
    );
    return (rows as any[]).map(row => row.table_name);
  }

  async getColumns(tableName: string): Promise<any[]> {
    const [rows] = await this.pool.query(
      `SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_key, 
        column_default,
        extra
      FROM information_schema.columns 
      WHERE table_schema = ? AND table_name = ?`,
      [this.options.database, tableName]
    );
    return rows as any[];
  }

  async getIndexes(tableName: string): Promise<any[]> {
    const [rows] = await this.pool.query(
      `SELECT 
        index_name, 
        column_name, 
        non_unique
      FROM information_schema.statistics 
      WHERE table_schema = ? AND table_name = ?`,
      [this.options.database, tableName]
    );
    return rows as any[];
  }

  async getForeignKeys(tableName: string): Promise<any[]> {
    const [rows] = await this.pool.query(
      `SELECT 
        constraint_name,
        column_name,
        referenced_table_name,
        referenced_column_name
      FROM information_schema.key_column_usage
      WHERE table_schema = ? 
        AND table_name = ? 
        AND referenced_table_name IS NOT NULL`,
      [this.options.database, tableName]
    );
    return rows as any[];
  }

  async executeTransaction(queries: string[]): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const query of queries) {
        await connection.query(query);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
} 