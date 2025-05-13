import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseClient, DatabaseConnectionOptions } from '../types/database-clients.types';

@Injectable()
export class PostgreSQLClient implements DatabaseClient {
  private pool: Pool;

  constructor(private readonly options: DatabaseConnectionOptions) {
    this.pool = new Pool({
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
    await this.pool.connect();
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  async getTables(): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public'`
    );
    return result.rows.map(row => row.table_name);
  }

  async getColumns(tableName: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        is_identity
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = $1`,
      [tableName]
    );
    return result.rows;
  }

  async getIndexes(tableName: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
        i.relname as index_name,
        a.attname as column_name,
        ix.indisunique as is_unique
      FROM pg_class t,
           pg_class i,
           pg_index ix,
           pg_attribute a
      WHERE t.oid = ix.indrelid
        AND i.oid = ix.indexrelid
        AND a.attrelid = t.oid
        AND a.attnum = ANY(ix.indkey)
        AND t.relkind = 'r'
        AND t.relname = $1`,
      [tableName]
    );
    return result.rows;
  }

  async getForeignKeys(tableName: string): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS referenced_table_name,
        ccu.column_name AS referenced_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1`,
      [tableName]
    );
    return result.rows;
  }

  async executeTransaction(queries: string[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const query of queries) {
        await client.query(query);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
} 