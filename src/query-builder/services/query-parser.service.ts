import { Injectable, BadRequestException } from '@nestjs/common';
import { QueryNode, QueryNodeType, ColumnDefinition, QueryBuilderInput } from '../types/query-builder.types';
import { Parser } from 'node-sql-parser';

@Injectable()
export class QueryParserService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  parse(input: QueryBuilderInput): QueryNode {
    try {
      const ast = this.parser.astify(input.query);
      return this.convertAstToQueryNode(ast, input.type);
    } catch (error) {
      throw new BadRequestException(`Failed to parse query: ${error.message}`);
    }
  }

  private convertAstToQueryNode(ast: any, type: QueryNodeType): QueryNode {
    const node: QueryNode = {
      type,
      table: ast.table?.[0]?.table || '',
      columns: this.extractColumns(ast),
      where: this.extractWhere(ast),
      orderBy: this.extractOrderBy(ast),
      limit: ast.limit?.value,
      offset: ast.limit?.offset,
      values: this.extractValues(ast),
      joins: this.extractJoins(ast),
    };

    if (!node.table) {
      throw new BadRequestException('Table name is required');
    }

    return node;
  }

  private extractColumns(ast: any): (string | ColumnDefinition)[] {
    if (!ast.columns) return [];
    return ast.columns.map((col: any) => {
      if (typeof col === 'string') return col;
      if (col.expr?.column) return col.expr.column;
      if (col.expr?.table) return `${col.expr.table}.${col.expr.column}`;
      return col.as || col.expr?.name || '*';
    });
  }

  private extractWhere(ast: any): string | undefined {
    if (!ast.where) return undefined;
    return this.parser.sqlify(ast.where);
  }

  private extractOrderBy(ast: any): Array<{ column: string; direction: 'ASC' | 'DESC' }> | undefined {
    if (!ast.orderby) return undefined;
    return ast.orderby.map((order: any) => ({
      column: order.expr.column,
      direction: order.type.toUpperCase(),
    }));
  }

  private extractValues(ast: any): any[] | undefined {
    if (!ast.values) return undefined;
    return ast.values.map((value: any) => {
      if (Array.isArray(value)) {
        return value.map(v => v.value);
      }
      return value.value;
    });
  }

  private extractJoins(ast: any): Array<{ type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'; table: string; on: string }> | undefined {
    if (!ast.from || !Array.isArray(ast.from)) return undefined;
    return ast.from
      .filter((item: any) => item.join)
      .map((join: any) => ({
        type: join.join.toUpperCase(),
        table: join.table[0].table,
        on: this.parser.sqlify(join.on),
      }));
  }
} 