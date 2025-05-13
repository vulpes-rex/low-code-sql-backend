import { Injectable } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';
import { DatabaseClient, DatabaseConnectionOptions } from '../types/database-clients.types';
import { promisify } from 'util';

@Injectable()
export class SQLiteClient implements DatabaseClient {
  private db: sqlite3.Database;

  constructor(private readonly options: DatabaseConnectionOptions) {
    this.db = new sqlite3.Database(options.database);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async query(sql: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getTables(): Promise<string[]> {
    const result = await this.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    return result.map(row => row.name);
  }

  async getColumns(tableName: string): Promise<any[]> {
    const result = await this.query(`PRAGMA table_info(${tableName})`);
    return result.map(row => ({
      column_name: row.name,
      data_type: row.type,
      is_nullable: !row.notnull,
      column_default: row.dflt_value,
      is_primary: row.pk === 1
    }));
  }

  async getIndexes(tableName: string): Promise<any[]> {
    const result = await this.query(`PRAGMA index_list(${tableName})`);
    const indexes = [];
    for (const index of result) {
      const columns = await this.query(`PRAGMA index_info(${index.name})`);
      indexes.push({
        index_name: index.name,
        columns: columns.map(col => col.name),
        is_unique: index.unique === 1
      });
    }
    return indexes;
  }

  async getForeignKeys(tableName: string): Promise<any[]> {
    const result = await this.query(`PRAGMA foreign_key_list(${tableName})`);
    return result.map(row => ({
      constraint_name: `fk_${tableName}_${row.from}`,
      column_name: row.from,
      referenced_table_name: row.table,
      referenced_column_name: row.to
    }));
  }

  async executeTransaction(queries: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        for (const query of queries) {
          this.db.run(query);
        }
        this.db.run('COMMIT', (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }
} 