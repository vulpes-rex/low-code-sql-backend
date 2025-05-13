import { Injectable, BadRequestException } from '@nestjs/common';
import { QueryNode, QueryNodeType, QueryValidationResult } from '../types/query-builder.types';

@Injectable()
export class QueryValidatorService {
  validate(query: QueryNode): QueryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!query.table) {
      errors.push('No table specified');
    }

    if (query.type === QueryNodeType.SELECT && (!query.columns || query.columns.length === 0)) {
      errors.push('No columns specified for SELECT query');
    }

    // Type-specific validation
    switch (query.type) {
      case QueryNodeType.SELECT:
        this.validateSelectQuery(query, errors, warnings);
        break;
      case QueryNodeType.INSERT:
        this.validateInsertQuery(query, errors, warnings);
        break;
      case QueryNodeType.UPDATE:
        this.validateUpdateQuery(query, errors, warnings);
        break;
      case QueryNodeType.DELETE:
        this.validateDeleteQuery(query, errors, warnings);
        break;
      case QueryNodeType.CREATE:
        this.validateCreateQuery(query, errors, warnings);
        break;
      case QueryNodeType.DROP:
        this.validateDropQuery(query, errors, warnings);
        break;
      default:
        errors.push(`Unsupported query type: ${query.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateSelectQuery(query: QueryNode, errors: string[], warnings: string[]): void {
    if (query.joins) {
      query.joins.forEach((join, index) => {
        if (!join.table) {
          errors.push(`Join #${index + 1} is missing table name`);
        }
        if (!join.on) {
          errors.push(`Join #${index + 1} is missing ON condition`);
        }
      });
    }

    if (query.orderBy) {
      query.orderBy.forEach((order, index) => {
        if (!order.column) {
          errors.push(`Order by #${index + 1} is missing column name`);
        }
        if (!order.direction) {
          errors.push(`Order by #${index + 1} is missing direction`);
        }
      });
    }
  }

  private validateInsertQuery(query: QueryNode, errors: string[], warnings: string[]): void {
    if (!query.columns || query.columns.length === 0) {
      errors.push('No columns specified for INSERT query');
    }

    if (!query.values || query.values.length === 0) {
      errors.push('No values specified for INSERT query');
    }

    if (query.columns && query.values && query.columns.length !== query.values.length) {
      errors.push('Number of columns does not match number of values');
    }
  }

  private validateUpdateQuery(query: QueryNode, errors: string[], warnings: string[]): void {
    if (!query.columns || query.columns.length === 0) {
      errors.push('No columns specified for UPDATE query');
    }

    if (!query.values || query.values.length === 0) {
      errors.push('No values specified for UPDATE query');
    }

    if (query.columns && query.values && query.columns.length !== query.values.length) {
      errors.push('Number of columns does not match number of values');
    }

    if (!query.where) {
      warnings.push('UPDATE query without WHERE clause will update all rows');
    }
  }

  private validateDeleteQuery(query: QueryNode, errors: string[], warnings: string[]): void {
    if (!query.where) {
      warnings.push('DELETE query without WHERE clause will delete all rows');
    }
  }

  private validateCreateQuery(query: QueryNode, errors: string[], warnings: string[]): void {
    if (!query.columns || query.columns.length === 0) {
      errors.push('No columns specified for CREATE query');
    }

    if (query.columns) {
      query.columns.forEach((col, index) => {
        if (typeof col === 'string') {
          errors.push(`Column #${index + 1} must be a ColumnDefinition object`);
        } else {
          if (!col.name) {
            errors.push(`Column #${index + 1} is missing name`);
          }
          if (!col.type) {
            errors.push(`Column #${index + 1} is missing type`);
          }
        }
      });
    }
  }

  private validateDropQuery(query: QueryNode, errors: string[], warnings: string[]): void {
    if (!query.table) {
      errors.push('No table specified for DROP query');
    }
  }
} 