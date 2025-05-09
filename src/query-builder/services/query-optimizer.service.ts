import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { DatabaseType } from '../../database/types/database-clients.types';
import { DatabaseConnectionDocument } from '../../database/schemas/database-connection.schema';

export interface OptimizationResult {
  originalQuery: string;
  optimizedQuery: string;
  explainPlan: any;
  suggestions: string[];
  estimatedCost: number;
}

@Injectable()
export class QueryOptimizerService {
  constructor(private readonly databaseService: DatabaseService) {}

  async optimizeQuery(connectionId: string, query: string): Promise<OptimizationResult> {
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }

    const explainPlan = await this.getExplainPlan(connectionId, query);
    const suggestions = this.generateOptimizationSuggestions(explainPlan, connection.type);
    const optimizedQuery = await this.rewriteQuery(query, suggestions, connection.type);

    return {
      originalQuery: query,
      optimizedQuery,
      explainPlan,
      suggestions,
      estimatedCost: this.calculateEstimatedCost(explainPlan, connection.type),
    };
  }

  private async getExplainPlan(connectionId: string, query: string): Promise<any> {
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }

    const explainQuery = this.buildExplainQuery(query, connection.type);
    return this.databaseService.executeQuery(connection, explainQuery);
  }

  private buildExplainQuery(query: string, databaseType: DatabaseType): string {
    switch (databaseType) {
      case DatabaseType.POSTGRESQL:
        return `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      case DatabaseType.MYSQL:
        return `EXPLAIN FORMAT=JSON ${query}`;
      case DatabaseType.SQLSERVER:
        return `SET SHOWPLAN_XML ON; ${query}; SET SHOWPLAN_XML OFF;`;
      case DatabaseType.MONGODB:
        return `db.collection.explain("executionStats").find(${query})`;
      default:
        throw new BadRequestException(`Unsupported database type: ${databaseType}`);
    }
  }

  private generateOptimizationSuggestions(explainPlan: any, databaseType: DatabaseType): string[] {
    const suggestions: string[] = [];

    switch (databaseType) {
      case DatabaseType.POSTGRESQL:
        this.analyzePostgresPlan(explainPlan, suggestions);
        break;
      case DatabaseType.MYSQL:
        this.analyzeMysqlPlan(explainPlan, suggestions);
        break;
      case DatabaseType.SQLSERVER:
        this.analyzeSqlServerPlan(explainPlan, suggestions);
        break;
      case DatabaseType.MONGODB:
        this.analyzeMongoPlan(explainPlan, suggestions);
        break;
    }

    return suggestions;
  }

  private analyzePostgresPlan(plan: any, suggestions: string[]): void {
    if (plan.Plan) {
      // Check for sequential scans
      if (plan.Plan.Node_Type === 'Seq Scan') {
        suggestions.push('Consider adding an index to avoid sequential scan');
      }

      // Check for nested loops
      if (plan.Plan.Node_Type === 'Nested Loop') {
        suggestions.push('Consider optimizing join conditions or adding indexes');
      }

      // Check for high cost operations
      if (plan.Plan.Total_Cost > 1000) {
        suggestions.push('Query might benefit from additional optimization');
      }
    }
  }

  private analyzeMysqlPlan(plan: any, suggestions: string[]): void {
    if (plan.query_block) {
      // Check for full table scans
      if (plan.query_block.table.type === 'ALL') {
        suggestions.push('Consider adding an index to avoid full table scan');
      }

      // Check for temporary tables
      if (plan.query_block.using_temporary_table) {
        suggestions.push('Consider optimizing GROUP BY or ORDER BY clauses');
      }
    }
  }

  private analyzeSqlServerPlan(plan: any, suggestions: string[]): void {
    // SQL Server specific analysis
    if (plan.ShowPlanXML?.BatchSequence?.Batch?.Statements?.StmtSimple) {
      const stmt = plan.ShowPlanXML.BatchSequence.Batch.Statements.StmtSimple;
      
      // Check for table scans
      if (stmt.QueryPlan?.RelOp?.PhysicalOp === 'Table Scan') {
        suggestions.push('Consider adding an index to avoid table scan');
      }

      // Check for high cost operations
      if (stmt.QueryPlan?.RelOp?.EstimatedTotalSubtreeCost > 1) {
        suggestions.push('Query might benefit from additional optimization');
      }
    }
  }

  private analyzeMongoPlan(plan: any, suggestions: string[]): void {
    if (plan.executionStats) {
      // Check for collection scans
      if (plan.executionStats.executionStages.stage === 'COLLSCAN') {
        suggestions.push('Consider adding an index to avoid collection scan');
      }

      // Check for high execution time
      if (plan.executionStats.executionTimeMillis > 100) {
        suggestions.push('Query might benefit from additional optimization');
      }
    }
  }

  private async rewriteQuery(
    query: string,
    suggestions: string[],
    databaseType: DatabaseType,
  ): Promise<string> {
    let optimizedQuery = query;

    // Apply basic optimizations
    optimizedQuery = this.removeUnnecessaryJoins(optimizedQuery);
    optimizedQuery = this.optimizeWhereClause(optimizedQuery);
    optimizedQuery = this.optimizeOrderBy(optimizedQuery);

    return optimizedQuery;
  }

  private removeUnnecessaryJoins(query: string): string {
    // Implement join optimization logic
    return query;
  }

  private optimizeWhereClause(query: string): string {
    // Implement WHERE clause optimization logic
    return query;
  }

  private optimizeOrderBy(query: string): string {
    // Implement ORDER BY optimization logic
    return query;
  }

  private calculateEstimatedCost(explainPlan: any, databaseType: DatabaseType): number {
    switch (databaseType) {
      case DatabaseType.POSTGRESQL:
        return explainPlan.Plan?.Total_Cost || 0;
      case DatabaseType.MYSQL:
        return explainPlan.query_block?.cost_info?.query_cost || 0;
      case DatabaseType.SQLSERVER:
        return explainPlan.ShowPlanXML?.BatchSequence?.Batch?.Statements?.StmtSimple?.QueryPlan?.RelOp?.EstimatedTotalSubtreeCost || 0;
      case DatabaseType.MONGODB:
        return explainPlan.executionStats?.executionTimeMillis || 0;
      default:
        return 0;
    }
  }
} 