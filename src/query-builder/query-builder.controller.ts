import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { QueryBuilderService } from './query-builder.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QueryBuilderInput, QueryExecutionResult, QueryNodeType } from './types/query-builder.types';
import { QueryParserService } from './services/query-parser.service';

@ApiTags('query-builder')
@Controller('query-builder')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QueryBuilderController {
  constructor(
    private readonly queryBuilderService: QueryBuilderService,
    private readonly queryParserService: QueryParserService,
  ) {}

  @Post()
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Create a new saved query' })
  @ApiResponse({ status: 201, description: 'Query created successfully' })
  async createQuery(@Request() req, @Body() queryData: any) {
    return this.queryBuilderService.createQuery(req.user.id, queryData);
  }

  @Get()
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Get all saved queries' })
  @ApiResponse({ status: 200, description: 'Return all saved queries' })
  async findAllQueries(@Request() req) {
    return this.queryBuilderService.findAllQueries(req.user.id);
  }

  @Get(':id')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Get a saved query by ID' })
  @ApiResponse({ status: 200, description: 'Return the saved query' })
  async findQueryById(@Request() req, @Param('id') id: string) {
    return this.queryBuilderService.findQueryById(req.user.id, parseInt(id, 10));
  }

  @Put(':id')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Update a saved query' })
  @ApiResponse({ status: 200, description: 'Query updated successfully' })
  async updateQuery(@Request() req, @Param('id') id: string, @Body() queryData: any) {
    return this.queryBuilderService.updateQuery(req.user.id, parseInt(id, 10), queryData);
  }

  @Delete(':id')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Delete a saved query' })
  @ApiResponse({ status: 200, description: 'Query deleted successfully' })
  async removeQuery(@Request() req, @Param('id') id: string) {
    return this.queryBuilderService.removeQuery(req.user.id, parseInt(id, 10));
  }

  @Post('execute')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Execute a saved query with parameters' })
  @ApiResponse({ status: 200, description: 'Query executed successfully' })
  async executeQuery(
    @Body() body: { connectionId: string; queryIdOrInput: string | QueryBuilderInput },
  ): Promise<QueryExecutionResult> {
    try {
      return await this.queryBuilderService.executeQuery(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('validate')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Validate a query' })
  @ApiResponse({ status: 200, description: 'Query validated successfully' })
  async validateQuery(
    @Body() body: { connectionId: string; query: string | QueryBuilderInput },
  ) {
    try {
      const query = typeof body.query === 'string' 
        ? { query: body.query, type: QueryNodeType.SELECT }
        : body.query;
      const parsedQuery = this.queryParserService.parse(query);
      return await this.queryBuilderService.validateQuery(body.connectionId, parsedQuery);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('optimize')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Optimize a query' })
  @ApiResponse({ status: 200, description: 'Query optimized successfully' })
  async optimizeQuery(
    @Body() body: { connectionId: string; query: string | QueryBuilderInput },
  ) {
    try {
      const query = typeof body.query === 'string' 
        ? { query: body.query, type: QueryNodeType.SELECT }
        : body.query;
      const parsedQuery = this.queryParserService.parse(query);
      return await this.queryBuilderService.optimizeQuery(parsedQuery);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/parameters')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Add a parameter to a saved query' })
  @ApiResponse({ status: 201, description: 'Parameter added successfully' })
  async createParameter(
    @Request() req,
    @Param('id') id: string,
    @Body() parameterData: any,
  ) {
    return this.queryBuilderService.createParameter(req.user.id, parseInt(id, 10), parameterData);
  }

  @Put(':id/parameters/:parameterId')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Update a query parameter' })
  @ApiResponse({ status: 200, description: 'Parameter updated successfully' })
  async updateParameter(
    @Request() req,
    @Param('id') id: string,
    @Param('parameterId') parameterId: string,
    @Body() parameterData: any,
  ) {
    return this.queryBuilderService.updateParameter(
      req.user.id,
      parseInt(id, 10),
      parseInt(parameterId, 10),
      parameterData,
    );
  }

  @Delete(':id/parameters/:parameterId')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Remove a parameter from a saved query' })
  @ApiResponse({ status: 200, description: 'Parameter removed successfully' })
  async removeParameter(
    @Request() req,
    @Param('id') id: string,
    @Param('parameterId') parameterId: string,
  ) {
    return this.queryBuilderService.removeParameter(
      req.user.id,
      parseInt(id, 10),
      parseInt(parameterId, 10),
    );
  }
} 