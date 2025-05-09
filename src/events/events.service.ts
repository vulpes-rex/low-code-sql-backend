import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
import { QueryBuilderInput } from '../query-builder/services/query-parser.service';
import { DatabaseConnectionDocument } from '../database/schemas/database-connection.schema';
import { CreateConnectionDto } from '../database/dto/create-connection.dto';
import { TestConnectionDto } from '../database/dto/test-connection.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
    private readonly queryBuilderService: QueryBuilderService,
  ) {}

  async validateToken(token: string): Promise<string> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload.sub;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async executeQuery(connectionId: string, query: string): Promise<any> {
    const connection = await this.databaseService.getConnection(connectionId, connectionId);
    if (!connection) {
      throw new Error('Database connection not found');
    }
    return this.databaseService.executeQuery(connection, query);
  }

  async executeQueryBuilder(connectionId: string, options: QueryBuilderInput): Promise<any> {
    return this.queryBuilderService.executeQuery(connectionId, options);
  }

  async getDatabaseSchema(connectionId: string): Promise<any> {
    return this.databaseService.getSchemas(connectionId, connectionId);
  }

  async testConnection(connectionData: TestConnectionDto): Promise<boolean> {
    const connection = await this.databaseService.createConnection('test', {
      name: 'Test Connection',
      type: connectionData.type,
      options: connectionData.options
    });
    return this.databaseService.testConnection(connection);
  }

  async createConnection(userId: string, connectionData: CreateConnectionDto): Promise<DatabaseConnectionDocument> {
    return this.databaseService.createConnection(userId, connectionData);
  }

  async getConnection(userId: string, connectionId: string): Promise<DatabaseConnectionDocument> {
    return this.databaseService.getConnection(userId, connectionId);
  }

  async listConnections(userId: string): Promise<DatabaseConnectionDocument[]> {
    const result = await this.databaseService.getConnections(userId, { page: 1, limit: 100 });
    return result.data;
  }
} 