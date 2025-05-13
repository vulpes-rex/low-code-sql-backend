import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseConfigService } from './services/database-config.service';
import { DatabaseConfig } from './entities/database-config.entity';

interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

@Controller('database')
export class DatabaseController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly databaseConfigService: DatabaseConfigService,
  ) {}

  @Post('connections')
  async createConnection(@Body() config: Partial<DatabaseConfig>): Promise<ApiResponse<DatabaseConfig>> {
    const data = await this.databaseConfigService.create(config);
    return { data };
  }

  @Get('connections')
  async getConnections(): Promise<ApiResponse<DatabaseConfig[]>> {
    const data = await this.databaseConfigService.findAll();
    return { data };
  }

  @Get('connections/:id')
  async getConnection(@Param('id') id: string): Promise<ApiResponse<DatabaseConfig>> {
    const data = await this.databaseConfigService.findById(id);
    return { data };
  }

  @Put('connections/:id')
  async updateConnection(
    @Param('id') id: string,
    @Body() config: Partial<DatabaseConfig>,
  ): Promise<ApiResponse<DatabaseConfig>> {
    const data = await this.databaseConfigService.update(id, config);
    return { data };
  }

  @Delete('connections/:id')
  async deleteConnection(@Param('id') id: string): Promise<ApiResponse<void>> {
    await this.databaseConfigService.remove(id);
    return { data: undefined };
  }

  @Get('query')
  async executeQuery(
    @Query('connectionId') connectionId: string,
    @Query('query') query: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.databaseService.executeQuery(connectionId, query);
    return { data };
  }

  @Get('schemas')
  async getSchemas(@Query('connectionId') connectionId: string): Promise<ApiResponse<string[]>> {
    const data = await this.databaseService.getSchemas(connectionId);
    return { data };
  }

  @Get('tables/:tableName/schema')
  async getTableSchema(
    @Query('connectionId') connectionId: string,
    @Param('tableName') tableName: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.databaseService.getTableSchema(connectionId, tableName);
    return { data };
  }
} 