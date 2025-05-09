import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DatabaseType } from '../../database/types/database-clients.types';
import { DatabaseConnectionDocument } from '../../database/schemas/database-connection.schema';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  schemaInfo: any;
}

@Injectable()
export class QueryValidatorService {
  constructor(private readonly databaseService: DatabaseService) {}

  async validateQuery(connectionId: string, query: string): Promise<ValidationResult> {
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }

    const schemaInfo = await this.getSchemaInfo(connectionId);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate query syntax
    await this.validateSyntax(connectionId, query, errors);

    // Validate against schema
    this.validateAgainstSchema(query, schemaInfo, errors, warnings);

    // Validate query complexity
    this.validateQueryComplexity(query, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      schemaInfo,
    };
  }

  private async validateSyntax(connectionId: string, query: string, errors: string[]): Promise<void> {
    try {
      // Try to parse the query
      const connection = await this.databaseService.getConnection(connectionId, connectionId);
      if (!connection) {
        throw new BadRequestException('Database connection not found');
      }
      await this.databaseService.executeQuery(connection, `EXPLAIN ${query}`);
    } catch (error) {
      errors.push(`Syntax error: ${error.message}`);
    }
  }

  private async getSchemaInfo(connectionId: string): Promise<any> {
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }

    switch (connection.type) {
      case DatabaseType.POSTGRESQL:
        return this.getPostgresSchemaInfo(connectionId);
      case DatabaseType.MYSQL:
        return this.getMysqlSchemaInfo(connectionId);
      case DatabaseType.SQLSERVER:
        return this.getSqlServerSchemaInfo(connectionId);
      case DatabaseType.MONGODB:
        return this.getMongoSchemaInfo(connectionId);
      default:
        throw new BadRequestException(`Unsupported database type: ${connection.type}`);
    }
  }

  private async getPostgresSchemaInfo(connectionId: string): Promise<any> {
    const query = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        tc.constraint_type,
        kcu.column_name as key_column
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      LEFT JOIN information_schema.table_constraints tc ON t.table_name = tc.table_name
      LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE t.table_schema = 'public'
    `;
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }
    return this.databaseService.executeQuery(connection, query);
  }

  private async getMysqlSchemaInfo(connectionId: string): Promise<any> {
    const query = `
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        CONSTRAINT_TYPE,
        KEY_COLUMN
      FROM information_schema.COLUMNS
      JOIN information_schema.TABLES USING (TABLE_NAME)
      LEFT JOIN information_schema.KEY_COLUMN_USAGE USING (TABLE_NAME, COLUMN_NAME)
      WHERE TABLE_SCHEMA = DATABASE()
    `;
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }
    return this.databaseService.executeQuery(connection, query);
  }

  private async getSqlServerSchemaInfo(connectionId: string): Promise<any> {
    const query = `
      SELECT 
        t.name AS table_name,
        c.name AS column_name,
        tp.name AS data_type,
        c.is_nullable,
        c.default_object_id,
        i.type_desc AS index_type,
        ic.key_ordinal
      FROM sys.tables t
      JOIN sys.columns c ON t.object_id = c.object_id
      JOIN sys.types tp ON c.user_type_id = tp.user_type_id
      LEFT JOIN sys.indexes i ON t.object_id = i.object_id
      LEFT JOIN sys.index_columns ic ON i.object_id = ic.object_id AND c.column_id = ic.column_id
    `;
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }
    return this.databaseService.executeQuery(connection, query);
  }

  private async getMongoSchemaInfo(connectionId: string): Promise<any> {
    // For MongoDB, we'll get collection information
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }

    const db = (connection as any).db;
    const collections = await db.listCollections().toArray();
    const schemaInfo = {};

    for (const collection of collections) {
      const sampleDoc = await db.collection(collection.name).findOne();
      if (sampleDoc) {
        schemaInfo[collection.name] = this.inferMongoSchema(sampleDoc);
      }
    }

    return schemaInfo;
  }

  private inferMongoSchema(doc: any): any {
    const schema = {};
    for (const [key, value] of Object.entries(doc)) {
      schema[key] = {
        type: typeof value,
        isArray: Array.isArray(value),
        isObject: typeof value === 'object' && value !== null && !Array.isArray(value),
      };
    }
    return schema;
  }

  private validateAgainstSchema(query: string, schemaInfo: any, errors: string[], warnings: string[]): void {
    // Extract table and column names from the query
    const tables = this.extractTables(query);
    const columns = this.extractColumns(query);

    // Validate tables exist
    for (const table of tables) {
      if (!schemaInfo[table]) {
        errors.push(`Table '${table}' does not exist in the schema`);
      }
    }

    // Validate columns exist in their respective tables
    for (const [table, cols] of Object.entries(columns)) {
      if (schemaInfo[table]) {
        for (const col of cols) {
          if (!schemaInfo[table][col]) {
            errors.push(`Column '${col}' does not exist in table '${table}'`);
          }
        }
      }
    }

    // Check for potential type mismatches
    this.checkTypeMismatches(query, schemaInfo, warnings);
  }

  private extractTables(query: string): string[] {
    // Implement table extraction logic
    return [];
  }

  private extractColumns(query: string): Record<string, string[]> {
    // Implement column extraction logic
    return {};
  }

  private checkTypeMismatches(query: string, schemaInfo: any, warnings: string[]): void {
    // Implement type mismatch checking logic
  }

  private validateQueryComplexity(query: string, warnings: string[]): void {
    const complexity = this.calculateWhereComplexity(query);
    if (complexity > 10) {
      warnings.push('Query complexity is high. Consider optimizing the query.');
    }
  }

  private calculateWhereComplexity(query: string): number {
    // Implement complexity calculation logic
    return 0;
  }
} 