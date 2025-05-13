import { QueryBuilderService } from '../query-builder/query-builder.service';
import { QueryBuilderInput, QueryNodeType, QueryExecutionInput } from '../query-builder/types/query-builder.types';
import { AdminApiService } from '../shared/services/admin-api.service';
import { DatabaseService } from '../database/database.service';
import { QueryValidatorService } from '../query-builder/services/query-validator.service';
import { QueryOptimizerService } from '../query-builder/services/query-optimizer.service';
import { QueryParserService } from '../query-builder/services/query-parser.service';
import { Repository } from 'typeorm';
import { SavedQuery } from '../query-builder/entities/saved-query.entity';
import { QueryParameter } from '../query-builder/entities/query-parameter.entity';

async function example() {
  // Create mock dependencies for example purposes
  const mockAdminApiService = {} as AdminApiService;
  const mockDatabaseService = {} as DatabaseService;
  const mockQueryValidatorService = {} as QueryValidatorService;
  const mockQueryOptimizerService = {} as QueryOptimizerService;
  const mockQueryParserService = {} as QueryParserService;
  const mockSavedQueryRepository = {} as Repository<SavedQuery>;
  const mockQueryParameterRepository = {} as Repository<QueryParameter>;

  const queryBuilderService = new QueryBuilderService(
    mockSavedQueryRepository,
    mockQueryParameterRepository,
    mockAdminApiService,
    mockDatabaseService,
    mockQueryParserService,
    mockQueryOptimizerService,
    mockQueryValidatorService
  );

  // Example SELECT query
  const userQuery: QueryBuilderInput = {
    type: QueryNodeType.SELECT,
    query: 'SELECT * FROM users WHERE age > 18'
  };

  // Parse the query first
  const parsedQuery = mockQueryParserService.parse(userQuery);

  // Optimize the query
  const optimizationResult = await queryBuilderService.optimizeQuery(parsedQuery);

  // Execute the query
  const userResults = await queryBuilderService.executeQuery({
    connectionId: 'connection-1',
    queryIdOrInput: userQuery
  });

  // Example INSERT query
  const insertQuery: QueryBuilderInput = {
    type: QueryNodeType.INSERT,
    query: 'INSERT INTO users (name, age) VALUES ("John", 25)'
  };

  // Example UPDATE query
  const updateQuery: QueryBuilderInput = {
    type: QueryNodeType.UPDATE,
    query: 'UPDATE users SET age = 26 WHERE name = "John"'
  };

  // Example DELETE query
  const deleteQuery: QueryBuilderInput = {
    type: QueryNodeType.DELETE,
    query: 'DELETE FROM users WHERE age < 18'
  };

  // Example CREATE query
  const createQuery: QueryBuilderInput = {
    type: QueryNodeType.CREATE,
    query: 'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255), age INT)'
  };

  // Example DROP query
  const dropQuery: QueryBuilderInput = {
    type: QueryNodeType.DROP,
    query: 'DROP TABLE users'
  };

  // Example complex SELECT query with joins
  const orderAnalysisQuery: QueryBuilderInput = {
    type: QueryNodeType.SELECT,
    query: `
      SELECT o.order_id, c.name, p.product_name, oi.quantity
      FROM orders o
      INNER JOIN customers c ON o.customer_id = c.id
      INNER JOIN order_items oi ON o.id = oi.order_id
      INNER JOIN products p ON oi.product_id = p.id
      WHERE o.order_date > '2023-01-01'
      ORDER BY o.order_date DESC
      LIMIT 100
    `
  };

  // Example MongoDB-style query
  const mongoSalesQuery: QueryBuilderInput = {
    type: QueryNodeType.SELECT,
    query: `
      SELECT 
        DATE_TRUNC('month', order_date) as month,
        SUM(total_amount) as total_sales,
        COUNT(*) as order_count
      FROM orders
      WHERE order_date >= '2023-01-01'
      GROUP BY DATE_TRUNC('month', order_date)
      ORDER BY month DESC
    `
  };

  // Example inventory query
  const inventoryQuery: QueryBuilderInput = {
    type: QueryNodeType.SELECT,
    query: `
      SELECT 
        p.product_name,
        COALESCE(SUM(i.quantity), 0) as current_stock,
        COALESCE(SUM(i.quantity * p.unit_price), 0) as stock_value
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      GROUP BY p.id, p.product_name
      HAVING COALESCE(SUM(i.quantity), 0) < p.reorder_level
      ORDER BY current_stock ASC
    `
  };

  // Example migration query
  const migrationQuery: QueryBuilderInput = {
    type: QueryNodeType.SELECT,
    query: `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default
      FROM information_schema.tables t
      JOIN information_schema.columns c 
        ON t.table_name = c.table_name
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name, c.ordinal_position
    `
  };

  // Execute queries
  const orderResults = await queryBuilderService.executeQuery({
    connectionId: 'connection-1',
    queryIdOrInput: orderAnalysisQuery
  });

  const salesResults = await queryBuilderService.executeQuery({
    connectionId: 'connection-1',
    queryIdOrInput: mongoSalesQuery
  });

  const inventoryResults = await queryBuilderService.executeQuery({
    connectionId: 'connection-1',
    queryIdOrInput: inventoryQuery
  });

  const migrationResults = await queryBuilderService.executeQuery({
    connectionId: 'connection-1',
    queryIdOrInput: migrationQuery
  });

  // Example of using saved queries
  const savedQuery = await queryBuilderService.createQuery('user-1', {
    name: 'Monthly Sales Report',
    description: 'Shows monthly sales totals',
    query: mongoSalesQuery.query,
    isPublic: true
  });

  // Example of using query parameters
  const parameter = await queryBuilderService.createParameter('user-1', savedQuery.id, {
    name: 'start_date',
    type: 'date',
    defaultValue: '2023-01-01',
    isRequired: true
  });

  // Example of updating a saved query
  const updatedQuery = await queryBuilderService.updateQuery('user-1', savedQuery.id, {
    description: 'Updated monthly sales report with additional metrics'
  });

  // Example of deleting a saved query
  await queryBuilderService.removeQuery('user-1', savedQuery.id);
}

// Example controller method
class QueryController {
  constructor(private readonly queryBuilderService: QueryBuilderService) {}

  async executeQuery(input: QueryExecutionInput) {
    return this.queryBuilderService.executeQuery(input);
  }
} 