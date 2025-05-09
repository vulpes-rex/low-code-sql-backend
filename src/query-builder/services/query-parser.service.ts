import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseType } from '../../database/types/database-clients.types';

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  on: string;
}

export interface AggregationClause {
  function: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  field: string;
  alias?: string;
}

export interface QueryBuilderInput {
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  fields?: string[];
  joins?: JoinClause[];
  where?: Record<string, any>;
  groupBy?: string[];
  having?: Record<string, any>;
  orderBy?: { field: string; direction: 'ASC' | 'DESC' }[];
  limit?: number;
  offset?: number;
  values?: Record<string, any>;
  aggregations?: AggregationClause[];
  subqueries?: {
    field: string;
    query: QueryBuilderInput;
  }[];
}

@Injectable()
export class QueryParserService {
  parseQuery(input: QueryBuilderInput, databaseType: DatabaseType): string {
    switch (databaseType) {
      case DatabaseType.MONGODB:
        return this.parseMongoQuery(input);
      case DatabaseType.POSTGRESQL:
      case DatabaseType.MYSQL:
      case DatabaseType.SQLSERVER:
        return this.parseSqlQuery(input);
      default:
        throw new BadRequestException(`Unsupported database type: ${databaseType}`);
    }
  }

  private parseSqlQuery(input: QueryBuilderInput): string {
    switch (input.operation) {
      case 'SELECT':
        return this.buildSelectQuery(input);
      case 'INSERT':
        return this.buildInsertQuery(input);
      case 'UPDATE':
        return this.buildUpdateQuery(input);
      case 'DELETE':
        return this.buildDeleteQuery(input);
      default:
        throw new BadRequestException('Unsupported operation');
    }
  }

  private buildSelectQuery(input: QueryBuilderInput): string {
    const fields = this.buildSelectFields(input);
    let query = `SELECT ${fields} FROM ${input.table}`;

    if (input.joins?.length) {
      query += this.buildJoinClauses(input.joins);
    }

    if (input.where) {
      query += ` WHERE ${this.buildWhereClause(input.where)}`;
    }

    if (input.groupBy?.length) {
      query += ` GROUP BY ${input.groupBy.join(', ')}`;
    }

    if (input.having) {
      query += ` HAVING ${this.buildWhereClause(input.having)}`;
    }

    if (input.orderBy?.length) {
      const orderClause = input.orderBy
        .map(order => `${order.field} ${order.direction}`)
        .join(', ');
      query += ` ORDER BY ${orderClause}`;
    }

    if (input.limit) {
      query += ` LIMIT ${input.limit}`;
    }

    if (input.offset) {
      query += ` OFFSET ${input.offset}`;
    }

    return query;
  }

  private buildInsertQuery(input: QueryBuilderInput): string {
    if (!input.values) {
      throw new BadRequestException('Values are required for INSERT operation');
    }

    const fields = Object.keys(input.values);
    const values = Object.values(input.values);
    const placeholders = values.map(() => '?').join(', ');

    return `INSERT INTO ${input.table} (${fields.join(', ')}) VALUES (${placeholders})`;
  }

  private buildUpdateQuery(input: QueryBuilderInput): string {
    if (!input.values) {
      throw new BadRequestException('Values are required for UPDATE operation');
    }

    const setClause = Object.entries(input.values)
      .map(([field]) => `${field} = ?`)
      .join(', ');

    let query = `UPDATE ${input.table} SET ${setClause}`;

    if (input.where) {
      query += ` WHERE ${this.buildWhereClause(input.where)}`;
    }

    return query;
  }

  private buildDeleteQuery(input: QueryBuilderInput): string {
    let query = `DELETE FROM ${input.table}`;

    if (input.where) {
      query += ` WHERE ${this.buildWhereClause(input.where)}`;
    }

    return query;
  }

  private buildSelectFields(input: QueryBuilderInput): string {
    const fields: string[] = [];

    // Add regular fields
    if (input.fields?.length) {
      fields.push(...input.fields);
    } else {
      fields.push('*');
    }

    // Add aggregations
    if (input.aggregations?.length) {
      input.aggregations.forEach(agg => {
        const alias = agg.alias ? ` AS ${agg.alias}` : '';
        fields.push(`${agg.function}(${agg.field})${alias}`);
      });
    }

    // Add subqueries
    if (input.subqueries?.length) {
      input.subqueries.forEach(subquery => {
        const subquerySql = this.parseQuery(subquery.query, DatabaseType.POSTGRESQL);
        fields.push(`(${subquerySql}) AS ${subquery.field}`);
      });
    }

    return fields.join(', ');
  }

  private buildJoinClauses(joins: JoinClause[]): string {
    return joins
      .map(join => `${join.type} JOIN ${join.table} ON ${join.on}`)
      .join(' ');
  }

  private buildWhereClause(where: Record<string, any>): string {
    return Object.entries(where)
      .map(([field, value]) => {
        if (typeof value === 'object') {
          const operator = Object.keys(value)[0];
          const operand = value[operator];
          return `${field} ${operator} ?`;
        }
        return `${field} = ?`;
      })
      .join(' AND ');
  }

  private parseMongoQuery(input: QueryBuilderInput): string {
    const query: any = {};

    // Build match stage (WHERE clause)
    if (input.where) {
      query.$match = this.buildMongoMatch(input.where);
    }

    // Build project stage (SELECT fields)
    if (input.fields?.length || input.aggregations?.length) {
      query.$project = this.buildMongoProject(input);
    }

    // Build group stage
    if (input.groupBy?.length || input.aggregations?.length) {
      query.$group = this.buildMongoGroup(input);
    }

    // Build sort stage
    if (input.orderBy?.length) {
      query.$sort = this.buildMongoSort(input.orderBy);
    }

    // Build limit and skip
    if (input.limit) {
      query.$limit = input.limit;
    }
    if (input.offset) {
      query.$skip = input.offset;
    }

    return JSON.stringify(query);
  }

  private buildMongoMatch(where: Record<string, any>): any {
    const match: any = {};
    Object.entries(where).forEach(([field, value]) => {
      if (typeof value === 'object') {
        const operator = Object.keys(value)[0];
        match[field] = { [`$${operator}`]: value[operator] };
      } else {
        match[field] = value;
      }
    });
    return match;
  }

  private buildMongoProject(input: QueryBuilderInput): any {
    const project: any = {};
    if (input.fields?.length) {
      input.fields.forEach(field => {
        project[field] = 1;
      });
    }
    if (input.aggregations?.length) {
      input.aggregations.forEach(agg => {
        const alias = agg.alias || `${agg.function.toLowerCase()}_${agg.field}`;
        project[alias] = { [`$${agg.function.toLowerCase()}`]: `$${agg.field}` };
      });
    }
    return project;
  }

  private buildMongoGroup(input: QueryBuilderInput): any {
    const group: any = {
      _id: input.groupBy?.length ? input.groupBy.reduce((acc, field) => ({ ...acc, [field]: `$${field}` }), {}) : null
    };

    if (input.aggregations?.length) {
      input.aggregations.forEach(agg => {
        const alias = agg.alias || `${agg.function.toLowerCase()}_${agg.field}`;
        group[alias] = { [`$${agg.function.toLowerCase()}`]: `$${agg.field}` };
      });
    }

    return group;
  }

  private buildMongoSort(orderBy: { field: string; direction: 'ASC' | 'DESC' }[]): any {
    return orderBy.reduce((acc, { field, direction }) => ({
      ...acc,
      [field]: direction === 'ASC' ? 1 : -1
    }), {});
  }
} 