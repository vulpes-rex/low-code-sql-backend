import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DatabaseService } from './database.service';
import { DatabaseConnection } from './schemas/database-connection.schema';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { TestConnectionDto } from './dto/test-connection.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { User } from '../common/decorators/user.decorator';

@Controller('database')
@UseGuards(JwtAuthGuard)
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post('connections')
  async createConnection(
    @User('id') userId: string,
    @Body() createConnectionDto: CreateConnectionDto,
  ) {
    return this.databaseService.createConnection(userId, createConnectionDto);
  }

  @Get('connections')
  async getConnections(
    @User('id') userId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.databaseService.getConnections(userId, paginationDto);
  }

  @Get('connections/:id')
  async getConnection(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.databaseService.getConnection(userId, id);
  }

  @Put('connections/:id')
  async updateConnection(
    @User('id') userId: string,
    @Param('id') id: string,
    @Body() updateConnectionDto: UpdateConnectionDto,
  ) {
    return this.databaseService.updateConnection(userId, id, updateConnectionDto);
  }

  @Delete('connections/:id')
  async deleteConnection(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.databaseService.deleteConnection(userId, id);
  }

  @Post('connections/:id/test')
  async testConnection(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    const connection = await this.databaseService.getConnection(userId, id);
    return this.databaseService.testConnection(connection);
  }

  @Get('connections/:id/schemas')
  async getSchemas(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.databaseService.getSchemas(userId, id);
  }

  @Get('connections/:id/tables')
  async getTables(
    @User('id') userId: string,
    @Param('id') id: string,
    @Query('schema') schema?: string,
  ) {
    return this.databaseService.getTables(userId, id, schema);
  }

  @Get('connections/:id/tables/:tableName/columns')
  async getTableColumns(
    @User('id') userId: string,
    @Param('id') id: string,
    @Param('tableName') tableName: string,
    @Query('schema') schema?: string,
  ) {
    return this.databaseService.getTableColumns(userId, id, tableName, schema);
  }

  @Get('connections/:id/status')
  async getConnectionStatus(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.databaseService.getConnectionStatus(userId, id);
  }

  @Post('connections/:id/encrypt')
  async encryptConnection(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.databaseService.encryptConnection(userId, id);
  }

  @Post('connections/:id/decrypt')
  async decryptConnection(
    @User('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.databaseService.decryptConnection(userId, id);
  }
} 