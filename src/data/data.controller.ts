import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { DataService } from './data.service';
import { QueryBuilderInput } from '../query-builder/types/query-builder.types';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Post(':connectionId/query')
  async executeQuery(
    @Param('connectionId') connectionId: string,
    @Body() query: QueryBuilderInput,
  ) {
    return this.dataService.executeQuery(connectionId, query);
  }

  @Get(':connectionId/schemas')
  async getSchemas(@Param('connectionId') connectionId: string) {
    return this.dataService.getSchemas(connectionId);
  }
} 