import { QueryBuilderService } from '../src/query-builder/query-builder.service';
import { QueryBuilderInput } from '../src/query-builder/services/query-parser.service';

// Example usage of the Query Builder
async function demonstrateQueryBuilder(queryBuilderService: QueryBuilderService) {
  const connectionId = 'your-connection-id';

  // Example 1: Simple User Query
  const userQuery: QueryBuilderInput = {
    table: 'users',
    operation: 'SELECT',
    fields: ['id', 'name', 'email', 'created_at'],
    where: {
      status: 'active',
      age: { '>': 18 },
      last_login: { '>': new Date('2023-01-01') }
    },
    orderBy: [
      { field: 'name', direction: 'ASC' }
    ],
    limit: 10
  };

  // Build and validate the query
  const validationResult = await queryBuilderService.validateQuery(connectionId, userQuery);
  console.log('Validation Result:', validationResult);

  // Optimize the query
  const optimizationResult = await queryBuilderService.optimizeQuery(connectionId, userQuery);
  console.log('Optimization Result:', optimizationResult);

  // Execute the query
  const userResults = await queryBuilderService.executeQuery(connectionId, userQuery);
  console.log('User Results:', userResults);

  // Example 2: Complex Order Analysis
  const orderAnalysisQuery: QueryBuilderInput = {
    table: 'orders',
    operation: 'SELECT',
    fields: ['orders.id', 'customers.name', 'products.name'],
    joins: [
      {
        type: 'INNER',
        table: 'customers',
        on: 'orders.customer_id = customers.id'
      },
      {
        type: 'INNER',
        table: 'order_items',
        on: 'orders.id = order_items.order_id'
      },
      {
        type: 'INNER',
        table: 'products',
        on: 'order_items.product_id = products.id'
      }
    ],
    aggregations: [
      {
        function: 'SUM',
        field: 'order_items.quantity',
        alias: 'total_quantity'
      },
      {
        function: 'SUM',
        field: 'order_items.price * order_items.quantity',
        alias: 'total_amount'
      }
    ],
    where: {
      'orders.status': 'completed',
      'orders.created_at': { '>': new Date('2023-01-01') }
    },
    groupBy: ['orders.id', 'customers.name', 'products.name'],
    having: {
      total_amount: { '>': 1000 }
    },
    orderBy: [
      { field: 'total_amount', direction: 'DESC' }
    ],
    limit: 20
  };

  // Example 3: MongoDB Sales Analysis
  const mongoSalesQuery: QueryBuilderInput = {
    table: 'sales',
    operation: 'SELECT',
    fields: ['product_id', 'region'],
    where: {
      status: 'completed',
      date: { '>': new Date('2023-01-01') }
    },
    aggregations: [
      {
        function: 'SUM',
        field: 'amount',
        alias: 'total_sales'
      },
      {
        function: 'AVG',
        field: 'amount',
        alias: 'average_sale'
      }
    ],
    groupBy: ['product_id', 'region'],
    having: {
      total_sales: { '>': 5000 }
    }
  };

  // Example 4: Product Inventory with Subquery
  const inventoryQuery: QueryBuilderInput = {
    table: 'products',
    operation: 'SELECT',
    fields: ['id', 'name', 'price', 'stock'],
    subqueries: [
      {
        field: 'total_orders',
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
            product_id: { '=': 'products.id' },
            created_at: { '>': new Date('2023-01-01') }
          }
        }
      },
      {
        field: 'average_rating',
        query: {
          table: 'product_reviews',
          operation: 'SELECT',
          aggregations: [
            {
              function: 'AVG',
              field: 'rating',
              alias: 'avg_rating'
            }
          ],
          where: {
            product_id: { '=': 'products.id' }
          }
        }
      }
    ],
    where: {
      category: 'electronics',
      stock: { '>': 0 }
    },
    orderBy: [
      { field: 'total_orders', direction: 'DESC' }
    ],
    limit: 10
  };

  // Example 5: Data Migration Query
  const migrationQuery: QueryBuilderInput = {
    table: 'old_users',
    operation: 'SELECT',
    fields: ['id', 'name', 'email', 'created_at'],
    where: {
      migrated: false
    },
    limit: 1000
  };

  // Process the queries
  try {
    // Execute the order analysis query
    const orderResults = await queryBuilderService.executeQuery(connectionId, orderAnalysisQuery);
    console.log('Order Analysis Results:', orderResults);

    // Execute the MongoDB sales query
    const salesResults = await queryBuilderService.executeQuery(connectionId, mongoSalesQuery);
    console.log('Sales Analysis Results:', salesResults);

    // Execute the inventory query
    const inventoryResults = await queryBuilderService.executeQuery(connectionId, inventoryQuery);
    console.log('Inventory Results:', inventoryResults);

    // Execute the migration query
    const migrationResults = await queryBuilderService.executeQuery(connectionId, migrationQuery);
    console.log('Migration Results:', migrationResults);

  } catch (error) {
    console.error('Error executing queries:', error);
  }
}

// Example of how to use the query builder in a NestJS controller
import { Controller, Post, Body, Param } from '@nestjs/common';

@Controller('api/queries')
export class QueryController {
  constructor(private readonly queryBuilderService: QueryBuilderService) {}

  @Post(':connectionId/analyze-orders')
  async analyzeOrders(
    @Param('connectionId') connectionId: string,
    @Body() dateRange: { startDate: Date; endDate: Date }
  ) {
    const query: QueryBuilderInput = {
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
      where: {
        'orders.created_at': {
          '>': dateRange.startDate,
          '<': dateRange.endDate
        }
      },
      groupBy: ['orders.id', 'customers.name'],
      orderBy: [
        { field: 'total_amount', direction: 'DESC' }
      ]
    };

    return this.queryBuilderService.executeQuery(connectionId, query);
  }
} 