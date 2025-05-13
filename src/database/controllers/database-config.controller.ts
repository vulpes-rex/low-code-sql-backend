import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { DatabaseConfigService } from '../services/database-config.service';
import { DatabaseConfig } from '../entities/database-config.entity';

@Controller('database-config')
export class DatabaseConfigController {
  constructor(private readonly databaseConfigService: DatabaseConfigService) {}

  @Post()
  async create(@Body() createDto: Partial<DatabaseConfig>): Promise<DatabaseConfig> {
    return this.databaseConfigService.create(createDto);
  }

  @Get()
  async findAll(): Promise<DatabaseConfig[]> {
    return this.databaseConfigService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<DatabaseConfig> {
    return this.databaseConfigService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: Partial<DatabaseConfig>,
  ): Promise<DatabaseConfig> {
    return this.databaseConfigService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.databaseConfigService.remove(id);
  }

  @Get(':id/status')
  async getConnectionStatus(@Param('id') id: string): Promise<{ status: string; message?: string }> {
    return this.databaseConfigService.getConnectionStatus(id);
  }
} 