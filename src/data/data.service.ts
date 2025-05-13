import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { QueryBuilderInput } from '../query-builder/types/query-builder.types';

@Injectable()
export class DataService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly queryBuilderService: QueryBuilderService,
  ) {}

  async executeQuery(connectionId: string, query: QueryBuilderInput) {
    try {
      return await this.queryBuilderService.executeQuery({
        connectionId,
        queryIdOrInput: query,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to execute query: ${error.message}`);
    }
  }

  async getSchemas(connectionId: string) {
    try {
      return await this.databaseService.getSchemas(connectionId);
    } catch (error) {
      throw new BadRequestException(`Failed to get schemas: ${error.message}`);
    }
  }
} 