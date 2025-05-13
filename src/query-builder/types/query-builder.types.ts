export enum QueryNodeType {
  SELECT = 'SELECT',
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CREATE = 'CREATE',
  DROP = 'DROP',
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  defaultValue?: any;
  isPrimary?: boolean;
  isUnique?: boolean;
  isIndexed?: boolean;
}

export interface QueryNode {
  type: QueryNodeType;
  table: string;
  columns?: (string | ColumnDefinition)[];
  where?: string;
  orderBy?: Array<{
    column: string;
    direction: 'ASC' | 'DESC';
  }>;
  limit?: number;
  offset?: number;
  values?: any[];
  joins?: Array<{
    type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
    table: string;
    on: string;
  }>;
}

export interface QueryOptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  appliedOptimizations: string[];
}

export interface QueryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface QueryExecutionResult {
  rows: any[];
  rowCount: number;
  executionTime: number;
  affectedRows?: number;
}

export interface QueryBuilderInput {
  type: QueryNodeType;
  query: string;
  parameters?: Record<string, any>;
}

export interface QueryExecutionInput {
  connectionId: string;
  queryIdOrInput: string | QueryBuilderInput;
} 