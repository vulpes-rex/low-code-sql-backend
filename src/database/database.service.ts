import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DatabaseConfigService } from './services/database-config.service';
import { DefaultDatabaseService } from './services/default-database.service';
import { DatabaseType } from './entities/database-config.entity';
import { QueryResult } from './interfaces/query-result.interface';

@Injectable()
export class DatabaseService {
  constructor(
    private readonly databaseConfigService: DatabaseConfigService,
    private readonly defaultDatabaseService: DefaultDatabaseService,
  ) {}

  async getDataSource(connectionId: string): Promise<DataSource> {
    if (connectionId === 'default') {
      return this.defaultDatabaseService.getDataSource();
    }
    return this.getUserConnection(connectionId);
  }

  private async getUserConnection(connectionId: string): Promise<DataSource> {
    const connection = await this.databaseConfigService.findById(connectionId);
    if (!connection) {
      throw new BadRequestException(`Database connection ${connectionId} not found`);
    }
    return this.databaseConfigService.getDataSource(connectionId);
  }

  async executeQuery(connectionId: string, query: string): Promise<QueryResult> {
    try {
      if (connectionId === 'default') {
        return this.defaultDatabaseService.executeQuery(query);
      }

      const connection = await this.databaseConfigService.findById(connectionId);
      const dataSource = await this.databaseConfigService.getDataSource(connectionId);
      
      const result = await dataSource.query(query);
      await dataSource.destroy(); // Close the connection after use
      
      return {
        rows: result,
        rowCount: Array.isArray(result) ? result.length : 0,
        fields: result.length > 0 ? Object.keys(result[0]).map(key => ({ name: key })) : [],
      };
    } catch (error) {
      throw new BadRequestException(`Error executing query: ${error.message}`);
    }
  }

  async getTableSchema(connectionId: string, tableName: string): Promise<any> {
    try {
      if (connectionId === 'default') {
        return this.defaultDatabaseService.getTableSchema(tableName);
      }

      const connection = await this.databaseConfigService.findById(connectionId);
      const dataSource = await this.databaseConfigService.getDataSource(connectionId);
      
      const schema = await dataSource.query(`
        SELECT 
            column_name, 
            data_type, 
            is_nullable, 
          column_default
          FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      await dataSource.destroy(); // Close the connection after use
      
      return schema;
    } catch (error) {
      throw new BadRequestException(`Error getting table schema: ${error.message}`);
    }
  }

  async getSchemas(connectionId: string): Promise<string[]> {
    const dataSource = await this.getDataSource(connectionId);
    try {
      const connection = connectionId === 'default' 
        ? { type: await this.getDefaultDatabaseType() }
        : await this.databaseConfigService.findById(connectionId);

      switch (connection.type) {
        case DatabaseType.POSTGRESQL:
          return this.getPostgresSchemas(dataSource);
        case DatabaseType.MYSQL:
        case DatabaseType.MARIADB:
          return this.getMySQLSchemas(dataSource);
        default:
          throw new BadRequestException(`Unsupported database type: ${connection.type}`);
      }
    } finally {
      // Only close user connections, not the default one
      if (connectionId !== 'default') {
        await dataSource.destroy();
      }
    }
  }

  private async getDefaultDatabaseType(): Promise<DatabaseType> {
    const dataSource = await this.defaultDatabaseService.getDataSource();
    const dbConfig = dataSource.options;
    switch (dbConfig.type) {
      case 'postgres':
        return DatabaseType.POSTGRESQL;
      case 'mysql':
        return DatabaseType.MYSQL;
      case 'mariadb':
        return DatabaseType.MARIADB;
      default:
        throw new BadRequestException(`Unsupported database type: ${dbConfig.type}`);
    }
  }

  private async getPostgresSchemas(dataSource: DataSource): Promise<string[]> {
    const result = await dataSource.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    `);
    return result.map((row: any) => row.schema_name);
  }

  private async getMySQLSchemas(dataSource: DataSource): Promise<string[]> {
    const result = await dataSource.query('SHOW DATABASES');
    return result.map((row: any) => row.Database);
  }
} 