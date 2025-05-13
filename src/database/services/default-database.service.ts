import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QueryResult } from '../interfaces/query-result.interface';

@Injectable()
export class DefaultDatabaseService {
  constructor(private readonly dataSource: DataSource) {}

  async getDataSource(): Promise<DataSource> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
    return this.dataSource;
  }

  async executeQuery(query: string): Promise<QueryResult> {
    const dataSource = await this.getDataSource();
    const result = await dataSource.query(query);
    
    return {
      rows: result,
      rowCount: Array.isArray(result) ? result.length : 0,
      fields: result.length > 0 ? Object.keys(result[0]).map(key => ({ name: key })) : [],
    };
  }

  async getTableSchema(tableName: string): Promise<any> {
    const dataSource = await this.getDataSource();
    return dataSource.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
  }
} 