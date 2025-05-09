# Query Builder Documentation

## Overview
The Query Builder is a powerful tool that allows you to construct and execute database queries in a type-safe and efficient manner. It supports multiple database types (PostgreSQL, MySQL, SQL Server, and MongoDB) and provides features for query parsing, validation, and optimization.

## Features

### 1. Query Parsing
- Supports both SQL and NoSQL query generation
- Handles complex queries with joins, subqueries, and aggregations
- Type-safe query building with TypeScript interfaces
- Automatic query generation based on database type

### 2. Query Validation
- Syntax validation
- Schema validation
- Type checking
- Query complexity analysis
- Real-time validation feedback

### 3. Query Optimization
- Explain plan generation
- Performance suggestions
- Query rewriting
- Cost estimation
- Database-specific optimizations

## API Endpoints

### 1. Build Query
```http
POST /query-builder/:connectionId/build
```
Builds a query based on the provided input.

### 2. Execute Query
```http
POST /query-builder/:connectionId/execute
```
Executes the built query and returns the results.

### 3. Validate Query
```http
POST /query-builder/:connectionId/validate
```
Validates the query and returns validation results.

### 4. Optimize Query
```http
POST /query-builder/:connectionId/optimize
```
Optimizes the query and returns optimization suggestions.

### 5. Get Table Schema
```http
POST /query-builder/:connectionId/schema/:tableName
```
Retrieves the schema information for a specific table.

## Query Builder Input Interface

```typescript
interface QueryBuilderInput {
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
```

## Examples

### 1. Simple SELECT Query
```typescript
const input: QueryBuilderInput = {
  table: 'users',
  operation: 'SELECT',
  fields: ['id', 'name', 'email'],
  where: {
    status: 'active',
    age: { '>': 18 }
  },
  orderBy: [
    { field: 'name', direction: 'ASC' }
  ],
  limit: 10
};
```

### 2. Complex Query with Joins and Aggregations
```typescript
const input: QueryBuilderInput = {
  table: 'orders',
  operation: 'SELECT',
  fields: ['orders.id', 'customers.name'],
  joins: [
    {
      type: 'INNER',
      table: 'customers',
      on: 'orders.customer_id = customers.id'
    }
  ],
  aggregations: [
    {
      function: 'SUM',
      field: 'orders.amount',
      alias: 'total_amount'
    }
  ],
  groupBy: ['orders.id', 'customers.name'],
  having: {
    total_amount: { '>': 1000 }
  }
};
```

### 3. MongoDB Aggregation Pipeline
```typescript
const input: QueryBuilderInput = {
  table: 'orders',
  operation: 'SELECT',
  fields: ['customer_id', 'status'],
  where: {
    status: 'completed',
    created_at: { '>': new Date('2023-01-01') }
  },
  aggregations: [
    {
      function: 'SUM',
      field: 'amount',
      alias: 'total_sales'
    }
  ],
  groupBy: ['customer_id', 'status']
};
```

### 4. Subquery Example
```typescript
const input: QueryBuilderInput = {
  table: 'products',
  operation: 'SELECT',
  fields: ['id', 'name', 'price'],
  subqueries: [
    {
      field: 'order_count',
      query: {
        table: 'order_items',
        operation: 'SELECT',
        aggregations: [
          {
            function: 'COUNT',
            field: 'id',
            alias: 'count'
          }
        ],
        where: {
          product_id: { '=': 'products.id' }
        }
      }
    }
  ]
};
```

## Best Practices

1. **Query Validation**
   - Always validate queries before execution
   - Check for schema compliance
   - Monitor query complexity

2. **Performance Optimization**
   - Use appropriate indexes
   - Limit the number of joins
   - Optimize WHERE clauses
   - Use pagination for large result sets

3. **Security**
   - Use parameterized queries
   - Validate user input
   - Implement proper access control
   - Sanitize query inputs

4. **Error Handling**
   - Handle database connection errors
   - Implement proper error messages
   - Log query execution errors
   - Provide meaningful feedback

## Common Issues and Solutions

1. **Performance Issues**
   - Use the query optimizer
   - Check explain plans
   - Monitor query execution time
   - Implement caching where appropriate

2. **Schema Changes**
   - Update queries when schema changes
   - Validate queries against current schema
   - Handle missing columns gracefully

3. **Type Mismatches**
   - Validate data types
   - Handle type conversions
   - Check for null values

4. **Complex Queries**
   - Break down complex queries
   - Use temporary tables
   - Implement proper indexing
   - Monitor query complexity 