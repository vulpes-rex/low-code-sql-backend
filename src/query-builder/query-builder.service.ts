import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { DatabaseType } from '../database/types/database-clients.types';
import { QueryParserService, QueryBuilderInput } from './services/query-parser.service';
import { QueryOptimizerService } from './services/query-optimizer.service';
import { QueryValidatorService } from './services/query-validator.service';
import { DatabaseConnectionDocument } from '../database/schemas/database-connection.schema';

@Injectable()
export class QueryBuilderService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly queryParser: QueryParserService,
    private readonly queryOptimizer: QueryOptimizerService,
    private readonly queryValidator: QueryValidatorService,
  ) {}

  async buildQuery(connectionId: string, input: QueryBuilderInput): Promise<string> {
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }

    // Parse the query
    const query = this.queryParser.parseQuery(input, connection.type);

    // Validate the query
    const validationResult = await this.queryValidator.validateQuery(connectionId, query);
    if (!validationResult.isValid) {
      throw new BadRequestException({
        message: 'Query validation failed',
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      });
    }

    // Optimize the query
    const optimizationResult = await this.queryOptimizer.optimizeQuery(connectionId, query);

    return optimizationResult.optimizedQuery;
  }

  async executeQuery(connectionId: string, input: QueryBuilderInput): Promise<any> {
    const query = await this.buildQuery(connectionId, input);
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }
    return this.databaseService.executeQuery(connection, query);
  }

  async validateQuery(connectionId: string, input: QueryBuilderInput): Promise<any> {
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }

    const query = this.queryParser.parseQuery(input, connection.type);
    return this.queryValidator.validateQuery(connectionId, query);
  }

  async optimizeQuery(connectionId: string, input: QueryBuilderInput): Promise<any> {
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }

    const query = this.queryParser.parseQuery(input, connection.type);
    return this.queryOptimizer.optimizeQuery(connectionId, query);
  }

  async getTableSchema(connectionId: string, tableName: string): Promise<any> {
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new BadRequestException('Database connection not found');
    }

    if (connection.type === DatabaseType.MONGODB) {
      throw new BadRequestException('Schema information is not available for MongoDB');
    }

    return this.databaseService.getSchemas(connectionId, connectionId);
  }
} 