import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedQuery } from './entities/saved-query.entity';
import { QueryParameter } from './entities/query-parameter.entity';
import { AdminApiService } from '../shared/services/admin-api.service';
import { DatabaseService } from '../database/database.service';
import { QueryParserService } from './services/query-parser.service';
import { QueryOptimizerService } from './services/query-optimizer.service';
import { QueryValidatorService } from './services/query-validator.service';
import { QueryNode, QueryNodeType, QueryBuilderInput, QueryValidationResult, QueryOptimizationResult, QueryExecutionResult } from './types/query-builder.types';
import { QueryResult } from '../database/interfaces/query-result.interface';

@Injectable()
export class QueryBuilderService {
  constructor(
    @InjectRepository(SavedQuery)
    private savedQueryRepository: Repository<SavedQuery>,
    @InjectRepository(QueryParameter)
    private queryParameterRepository: Repository<QueryParameter>,
    private readonly adminApiService: AdminApiService,
    private readonly databaseService: DatabaseService,
    private readonly queryParserService: QueryParserService,
    private readonly queryOptimizer: QueryOptimizerService,
    private readonly queryValidator: QueryValidatorService,
  ) {}

  private async checkPermission(userId: string, action: string, resourceType: string): Promise<void> {
    const hasPermission = await this.adminApiService.checkUserPermission(userId, `${action}_${resourceType}`);
    if (!hasPermission) {
      throw new ForbiddenException(`User does not have permission to ${action} ${resourceType}`);
    }
  }

  async createQuery(userId: string, queryData: Partial<SavedQuery>): Promise<SavedQuery> {
    await this.checkPermission(userId, 'create', 'query');
    const query = this.savedQueryRepository.create({
      ...queryData,
      createdBy: parseInt(userId, 10),
    });
    return this.savedQueryRepository.save(query);
  }

  async findAllQueries(userId: string): Promise<SavedQuery[]> {
    await this.checkPermission(userId, 'read', 'query');
    return this.savedQueryRepository.find({
      where: [
        { createdBy: parseInt(userId, 10) },
        { isPublic: true }
      ],
      relations: ['parameters'],
    });
  }

  async findQueryById(userId: string, id: number): Promise<SavedQuery> {
    await this.checkPermission(userId, 'read', 'query');
    const query = await this.savedQueryRepository.findOne({
      where: { id },
      relations: ['parameters'],
    });
    if (!query) {
      throw new NotFoundException(`Query with ID ${id} not found`);
    }
    if (query.createdBy !== parseInt(userId, 10) && !query.isPublic) {
      throw new ForbiddenException('You do not have access to this query');
    }
    return query;
  }

  async updateQuery(userId: string, id: number, queryData: Partial<SavedQuery>): Promise<SavedQuery> {
    const query = await this.findQueryById(userId, id);
    if (query.createdBy !== parseInt(userId, 10)) {
      throw new ForbiddenException('You can only update your own queries');
    }
    await this.savedQueryRepository.update(id, queryData);
    return this.findQueryById(userId, id);
  }

  async removeQuery(userId: string, id: number): Promise<void> {
    const query = await this.findQueryById(userId, id);
    if (query.createdBy !== parseInt(userId, 10)) {
      throw new ForbiddenException('You can only delete your own queries');
    }
    await this.savedQueryRepository.delete(id);
  }

  async executeQuery(input: { connectionId: string; queryIdOrInput: string | QueryBuilderInput }): Promise<QueryExecutionResult> {
    const { connectionId, queryIdOrInput } = input;
    const query = typeof queryIdOrInput === 'string' ? queryIdOrInput : queryIdOrInput.query;

    // Parse and validate the query
    const parsedQuery = this.queryParserService.parse(
      typeof queryIdOrInput === 'string' 
        ? { query: queryIdOrInput, type: QueryNodeType.SELECT }
        : queryIdOrInput
    );

    // Validate the query
    const validationResult = await this.validateQuery(connectionId, parsedQuery);
    if (!validationResult.isValid) {
      throw new BadRequestException(`Invalid query: ${validationResult.errors.join(', ')}`);
    }

    // Optimize the query
    const optimizationResult = this.queryOptimizer.optimizeQuery(parsedQuery);
    const optimizedQuery = optimizationResult.optimizedQuery;

    // Execute the query
    const startTime = Date.now();
    const result = await this.databaseService.executeQuery(connectionId, optimizedQuery);
    const executionTime = Date.now() - startTime;

    return {
      rows: result.rows,
      rowCount: result.rowCount,
      affectedRows: result.affectedRows,
      executionTime,
    };
  }

  async validateQuery(connectionId: string, query: QueryNode): Promise<QueryValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!query.table) {
      errors.push('No table specified');
    }

    if (query.type === QueryNodeType.SELECT && (!query.columns || query.columns.length === 0)) {
      errors.push('No columns specified for SELECT query');
    }

    // Schema validation
    try {
      const schemas = await this.databaseService.getSchemas(connectionId);
      if (query.table && !schemas.includes(query.table.split('.')[0])) {
        errors.push(`Table ${query.table} not found in any schema`);
      }
    } catch (error) {
      errors.push(`Failed to validate schema: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async optimizeQuery(query: QueryNode): Promise<QueryOptimizationResult> {
    return this.queryOptimizer.optimizeQuery(query);
  }

  async getSchemas(connectionId: string): Promise<string[]> {
    try {
      return await this.databaseService.getSchemas(connectionId);
    } catch (error) {
      throw new BadRequestException(`Failed to get schemas: ${error.message}`);
    }
  }

  async createParameter(userId: string, queryId: number, parameterData: Partial<QueryParameter>): Promise<QueryParameter> {
    const query = await this.findQueryById(userId, queryId);
    if (query.createdBy !== parseInt(userId, 10)) {
      throw new ForbiddenException('You can only add parameters to your own queries');
    }

    const parameter = this.queryParameterRepository.create({
      ...parameterData,
      savedQueryId: queryId,
    });
    return this.queryParameterRepository.save(parameter);
  }

  async updateParameter(userId: string, queryId: number, parameterId: number, parameterData: Partial<QueryParameter>): Promise<QueryParameter> {
    const query = await this.findQueryById(userId, queryId);
    if (query.createdBy !== parseInt(userId, 10)) {
      throw new ForbiddenException('You can only update parameters of your own queries');
    }

    await this.queryParameterRepository.update(parameterId, parameterData);
    return this.queryParameterRepository.findOne({ where: { id: parameterId } });
  }

  async removeParameter(userId: string, queryId: number, parameterId: number): Promise<void> {
    const query = await this.findQueryById(userId, queryId);
    if (query.createdBy !== parseInt(userId, 10)) {
      throw new ForbiddenException('You can only remove parameters from your own queries');
    }

    await this.queryParameterRepository.delete(parameterId);
  }

  async buildQueryFromInput(connectionId: string, input: QueryBuilderInput): Promise<string> {
    // Parse the query
    const parsedQuery = this.queryParserService.parse(input);

    // Validate the query
    const validationResult = this.queryValidator.validate(parsedQuery);
    if (!validationResult.isValid) {
      throw new BadRequestException({
        message: 'Query validation failed',
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      });
    }

    // Optimize the query
    const optimizationResult = this.queryOptimizer.optimizeQuery(parsedQuery);

    return optimizationResult.optimizedQuery;
  }
} 