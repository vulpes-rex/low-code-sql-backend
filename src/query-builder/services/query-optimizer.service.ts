import { Injectable, BadRequestException } from '@nestjs/common';
import { QueryNode, QueryNodeType, QueryOptimizationResult } from '../types/query-builder.types';
import { QueryParserService } from './query-parser.service';

@Injectable()
export class QueryOptimizerService {
  constructor(
    private readonly parser: QueryParserService,
  ) {}

  optimizeQuery(query: QueryNode): QueryOptimizationResult {
    const appliedOptimizations: string[] = [];
    let optimizedQuery = this.buildQuery(query);

    // Add basic optimizations
    if (query.type === QueryNodeType.SELECT) {
      if (query.limit && !query.orderBy) {
        appliedOptimizations.push('Added ORDER BY for LIMIT optimization');
        optimizedQuery += ' ORDER BY 1';
      }
    }

    return {
      originalQuery: this.buildQuery(query),
      optimizedQuery,
      appliedOptimizations,
    };
  }

  private buildQuery(query: QueryNode): string {
    switch (query.type) {
      case QueryNodeType.SELECT:
        return this.buildSelectQuery(query);
      case QueryNodeType.INSERT:
        return this.buildInsertQuery(query);
      case QueryNodeType.UPDATE:
        return this.buildUpdateQuery(query);
      case QueryNodeType.DELETE:
        return this.buildDeleteQuery(query);
      case QueryNodeType.CREATE:
        return this.buildCreateQuery(query);
      case QueryNodeType.DROP:
        return this.buildDropQuery(query);
      default:
        throw new BadRequestException(`Unsupported query type: ${query.type}`);
    }
  }

  private buildSelectQuery(query: QueryNode): string {
    const columns = query.columns?.map(col => 
      typeof col === 'string' ? col : col.name
    ).join(', ') || '*';

    let sql = `SELECT ${columns} FROM ${query.table}`;

    if (query.joins) {
      sql += ' ' + query.joins.map(join => 
        `${join.type} JOIN ${join.table} ON ${join.on}`
      ).join(' ');
    }

    if (query.where) {
      sql += ` WHERE ${query.where}`;
    }

    if (query.orderBy) {
      sql += ' ORDER BY ' + query.orderBy.map(order => 
        `${order.column} ${order.direction}`
      ).join(', ');
    }

    if (query.limit) {
      sql += ` LIMIT ${query.limit}`;
    }

    if (query.offset) {
      sql += ` OFFSET ${query.offset}`;
    }

    return sql;
  }

  private buildInsertQuery(query: QueryNode): string {
    if (!query.columns || !query.values) {
      throw new BadRequestException('Columns and values are required for INSERT query');
    }

    const columns = query.columns.map(col => 
      typeof col === 'string' ? col : col.name
    ).join(', ');

    const values = query.values.map(value => 
      Array.isArray(value) ? `(${value.join(', ')})` : `(${value})`
    ).join(', ');

    return `INSERT INTO ${query.table} (${columns}) VALUES ${values}`;
  }

  private buildUpdateQuery(query: QueryNode): string {
    if (!query.columns || !query.values) {
      throw new BadRequestException('Columns and values are required for UPDATE query');
    }

    const setClause = query.columns.map((col, index) => {
      const column = typeof col === 'string' ? col : col.name;
      return `${column} = ${query.values![index]}`;
    }).join(', ');

    let sql = `UPDATE ${query.table} SET ${setClause}`;

    if (query.where) {
      sql += ` WHERE ${query.where}`;
    }

    return sql;
  }

  private buildDeleteQuery(query: QueryNode): string {
    let sql = `DELETE FROM ${query.table}`;

    if (query.where) {
      sql += ` WHERE ${query.where}`;
    }

    return sql;
  }

  private buildCreateQuery(query: QueryNode): string {
    if (!query.columns) {
      throw new BadRequestException('Columns are required for CREATE query');
    }

    const columns = query.columns.map(col => {
      if (typeof col === 'string') {
        return col;
      }
      const constraints = [];
      if (col.isPrimary) constraints.push('PRIMARY KEY');
      if (col.isUnique) constraints.push('UNIQUE');
      if (!col.nullable) constraints.push('NOT NULL');
      if (col.defaultValue !== undefined) constraints.push(`DEFAULT ${col.defaultValue}`);
      return `${col.name} ${col.type} ${constraints.join(' ')}`;
    }).join(', ');

    return `CREATE TABLE ${query.table} (${columns})`;
  }

  private buildDropQuery(query: QueryNode): string {
    return `DROP TABLE ${query.table}`;
  }
} 