import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { QueryBuilderService } from './query-builder.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryBuilderInput } from './services/query-parser.service';

@Controller('query-builder')
@UseGuards(JwtAuthGuard)
export class QueryBuilderController {
  constructor(private readonly queryBuilderService: QueryBuilderService) {}

  @Post(':connectionId/build')
  async buildQuery(
    @Param('connectionId') connectionId: string,
    @Body() input: QueryBuilderInput,
  ) {
    return this.queryBuilderService.buildQuery(connectionId, input);
  }

  @Post(':connectionId/execute')
  async executeQuery(
    @Param('connectionId') connectionId: string,
    @Body() input: QueryBuilderInput,
  ) {
    return this.queryBuilderService.executeQuery(connectionId, input);
  }

  @Post(':connectionId/validate')
  async validateQuery(
    @Param('connectionId') connectionId: string,
    @Body() input: QueryBuilderInput,
  ) {
    return this.queryBuilderService.validateQuery(connectionId, input);
  }

  @Post(':connectionId/optimize')
  async optimizeQuery(
    @Param('connectionId') connectionId: string,
    @Body() input: QueryBuilderInput,
  ) {
    return this.queryBuilderService.optimizeQuery(connectionId, input);
  }

  @Post(':connectionId/schema/:tableName')
  async getTableSchema(
    @Param('connectionId') connectionId: string,
    @Param('tableName') tableName: string,
  ) {
    return this.queryBuilderService.getTableSchema(connectionId, tableName);
  }
} 