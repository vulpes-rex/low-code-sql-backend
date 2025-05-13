import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseConfigService } from './database-config.service';
import { TableMetadata } from '../entities/table-metadata.entity';
import { ColumnMetadata } from '../entities/column-metadata.entity';
import { IndexMetadata } from '../entities/index-metadata.entity';
import { ForeignKeyMetadata } from '../entities/foreign-key-metadata.entity';
import { DatabaseType } from '../entities/database-config.entity';
import { DatabaseService } from '../database.service';
import { TableDefinition, ColumnDefinition } from '../types/table-definition.type';

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array';

@Injectable()
export class TableManagementService {
  constructor(
    @InjectRepository(TableMetadata)
    private readonly tableMetadataRepository: Repository<TableMetadata>,
    @InjectRepository(ColumnMetadata)
    private columnMetadataRepository: Repository<ColumnMetadata>,
    @InjectRepository(IndexMetadata)
    private indexMetadataRepository: Repository<IndexMetadata>,
    @InjectRepository(ForeignKeyMetadata)
    private foreignKeyMetadataRepository: Repository<ForeignKeyMetadata>,
    private readonly databaseConfigService: DatabaseConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  async createTable(databaseId: string, definition: TableDefinition): Promise<void> {
    const dataSource = await this.databaseService.getDataSource(databaseId);
    const queryRunner = dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Create the table
      const columns = definition.columns.map(col => this.buildColumnDefinition(col));
      const primaryKey = definition.primaryKey ? `PRIMARY KEY (${definition.primaryKey.join(', ')})` : '';
      const foreignKeys = definition.foreignKeys?.map(fk => this.buildForeignKeyDefinition(fk)) || [];
      const indices = definition.indices?.map(idx => this.buildIndexDefinition(idx)) || [];

      const createTableQuery = `
        CREATE TABLE ${definition.name} (
          ${[...columns, primaryKey, ...foreignKeys].filter(Boolean).join(',\n')}
        )
        ${this.buildTableOptions(definition.options)}
      `;

      await queryRunner.query(createTableQuery);

      // Create indices
      for (const index of indices) {
        await queryRunner.query(index);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Failed to create table: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async getTables(databaseId: string): Promise<string[]> {
    const dataSource = await this.databaseService.getDataSource(databaseId);
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    return tables.map(t => t.table_name);
  }

  async getTableMetadata(databaseId: string, tableName: string): Promise<TableDefinition> {
    const dataSource = await this.databaseService.getDataSource(databaseId);
    
    // Get columns
    const columns = await dataSource.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    // Get primary key
    const primaryKey = await dataSource.query(`
      SELECT column_name
      FROM information_schema.key_column_usage
      WHERE table_name = $1
      AND constraint_name = (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = $1
        AND constraint_type = 'PRIMARY KEY'
      )
    `, [tableName]);

    // Get foreign keys
    const foreignKeys = await dataSource.query(`
      SELECT
        kcu.constraint_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.constraint_column_usage ccu
        ON kcu.constraint_name = ccu.constraint_name
      WHERE kcu.table_name = $1
      AND kcu.constraint_name IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = $1
        AND constraint_type = 'FOREIGN KEY'
      )
    `, [tableName]);

    // Get indices
    const indices = await dataSource.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = $1
    `, [tableName]);

    return {
      name: tableName,
      columns: columns.map(col => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        defaultValue: col.column_default,
        length: col.character_maximum_length,
        precision: col.numeric_precision,
        scale: col.numeric_scale,
      })),
      primaryKey: primaryKey.map(pk => pk.column_name),
      foreignKeys: this.groupForeignKeys(foreignKeys),
      indices: indices.map(idx => ({
        name: idx.indexname,
        columns: this.extractIndexColumns(idx.indexdef),
        isUnique: idx.indexdef.includes('UNIQUE'),
      })),
    };
  }

  async getSupportedColumnTypes(databaseId: string): Promise<string[]> {
    const dataSource = await this.databaseService.getDataSource(databaseId);
    const types = await dataSource.query(`
      SELECT typname
      FROM pg_type
      WHERE typtype = 'b'
      AND typname NOT LIKE 'pg_%'
      ORDER BY typname
    `);
    return types.map(t => t.typname);
  }

  async modifyTable(
    databaseId: string,
    tableName: string,
    updates: {
      addColumns?: ColumnDefinition[];
      dropColumns?: string[];
      modifyColumns?: Array<{
        name: string;
        type?: string;
        nullable?: boolean;
        defaultValue?: any;
      }>;
    },
  ): Promise<void> {
    const dataSource = await this.databaseService.getDataSource(databaseId);
    const queryRunner = dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Add columns
      if (updates.addColumns?.length) {
        for (const col of updates.addColumns) {
          const columnDef = this.buildColumnDefinition(col);
          await queryRunner.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`);
        }
      }

      // Drop columns
      if (updates.dropColumns?.length) {
        for (const col of updates.dropColumns) {
          await queryRunner.query(`ALTER TABLE ${tableName} DROP COLUMN ${col}`);
        }
      }

      // Modify columns
      if (updates.modifyColumns?.length) {
        for (const col of updates.modifyColumns) {
          const modifications = [];
          if (col.type) modifications.push(`TYPE ${col.type}`);
          if (col.nullable !== undefined) {
            modifications.push(col.nullable ? 'DROP NOT NULL' : 'SET NOT NULL');
          }
          if (col.defaultValue !== undefined) {
            modifications.push(`SET DEFAULT ${col.defaultValue}`);
          }
          if (modifications.length) {
            await queryRunner.query(
              `ALTER TABLE ${tableName} ALTER COLUMN ${col.name} ${modifications.join(', ')}`
            );
          }
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Failed to modify table: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTable(databaseId: string, tableName: string): Promise<void> {
    const dataSource = await this.databaseService.getDataSource(databaseId);
    await dataSource.query(`DROP TABLE IF EXISTS ${tableName}`);
  }

  private buildColumnDefinition(column: ColumnDefinition): string {
    const parts = [
      column.name,
      column.type,
      column.length ? `(${column.length})` : '',
      column.precision && column.scale ? `(${column.precision},${column.scale})` : '',
      column.nullable === false ? 'NOT NULL' : '',
      column.defaultValue !== undefined ? `DEFAULT ${column.defaultValue}` : '',
      column.isPrimary ? 'PRIMARY KEY' : '',
      column.isUnique ? 'UNIQUE' : '',
    ];
    return parts.filter(Boolean).join(' ');
  }

  private buildForeignKeyDefinition(fk: any): string {
    return `CONSTRAINT ${fk.name} FOREIGN KEY (${fk.columns.join(', ')}) ` +
      `REFERENCES ${fk.referencedTable} (${fk.referencedColumns.join(', ')}) ` +
      `${fk.onDelete ? `ON DELETE ${fk.onDelete}` : ''} ` +
      `${fk.onUpdate ? `ON UPDATE ${fk.onUpdate}` : ''}`;
  }

  private buildIndexDefinition(idx: any): string {
    return `CREATE ${idx.isUnique ? 'UNIQUE ' : ''}INDEX ${idx.name} ` +
      `ON ${idx.table} (${idx.columns.join(', ')}) ` +
      `${idx.type ? `USING ${idx.type}` : ''}`;
  }

  private buildTableOptions(options?: TableDefinition['options']): string {
    if (!options) return '';
    const parts = [];
    if (options.engine) parts.push(`ENGINE = ${options.engine}`);
    if (options.charset) parts.push(`CHARACTER SET ${options.charset}`);
    if (options.collate) parts.push(`COLLATE ${options.collate}`);
    if (options.comment) parts.push(`COMMENT = '${options.comment}'`);
    return parts.length ? parts.join(' ') : '';
  }

  private groupForeignKeys(foreignKeys: any[]): any[] {
    const grouped = new Map();
    for (const fk of foreignKeys) {
      if (!grouped.has(fk.constraint_name)) {
        grouped.set(fk.constraint_name, {
          name: fk.constraint_name,
          columns: [],
          referencedTable: fk.referenced_table,
          referencedColumns: [],
        });
      }
      const group = grouped.get(fk.constraint_name);
      group.columns.push(fk.column_name);
      group.referencedColumns.push(fk.referenced_column);
    }
    return Array.from(grouped.values());
  }

  private extractIndexColumns(indexDef: string): string[] {
    const match = indexDef.match(/\(([^)]+)\)/);
    if (!match) return [];
    return match[1].split(',').map(col => col.trim());
  }
} 