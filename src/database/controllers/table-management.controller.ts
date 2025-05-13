import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TableManagementService } from '../services/table-management.service';
import { TableDefinition } from '../types/table-definition.type';

@Controller('databases/:databaseId/tables')
export class TableManagementController {
  constructor(private readonly tableManagementService: TableManagementService) {}

  @Post()
  async createTable(
    @Param('databaseId') databaseId: string,
    @Body() tableDefinition: TableDefinition,
  ) {
    return this.tableManagementService.createTable(databaseId, tableDefinition);
  }

  @Get()
  async getTables(@Param('databaseId') databaseId: string) {
    return this.tableManagementService.getTables(databaseId);
  }

  @Get(':tableName')
  async getTableMetadata(
    @Param('databaseId') databaseId: string,
    @Param('tableName') tableName: string,
  ) {
    return this.tableManagementService.getTableMetadata(databaseId, tableName);
  }

  @Get('column-types')
  async getSupportedColumnTypes(@Param('databaseId') databaseId: string) {
    return this.tableManagementService.getSupportedColumnTypes(databaseId);
  }

  @Put(':tableName')
  async updateTable(
    @Param('databaseId') databaseId: string,
    @Param('tableName') tableName: string,
    @Body() updates: {
      addColumns?: TableDefinition['columns'];
      dropColumns?: string[];
      modifyColumns?: Array<{
        name: string;
        type?: string;
        nullable?: boolean;
        defaultValue?: any;
      }>;
    },
  ) {
    return this.tableManagementService.modifyTable(databaseId, tableName, updates);
  }

  @Delete(':tableName')
  async deleteTable(
    @Param('databaseId') databaseId: string,
    @Param('tableName') tableName: string,
  ) {
    return this.tableManagementService.deleteTable(databaseId, tableName);
  }
} 