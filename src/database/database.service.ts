import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Pool, Factory, Options, createPool } from 'generic-pool';
import { DatabaseConnectionDocument, DATABASE_CONNECTION, ConnectionOptions } from './schemas/database-connection.schema';
import { DatabaseClientFactory } from './factories/database-client.factory';
import { 
  DatabaseType,
  isMySQLClient,
  isSQLServerClient,
  isPostgreSQLClient,
  isMongoDBClient,
  QueryResultType,
  ConnectionPoolOptions,
  QueryExecutionOptions,
  QueryError,
  ConnectionError,
  MySQLClient,
  SQLServerClient,
  PostgreSQLClient,
  MongoDBClient,
  DatabaseClient
} from './types/database-clients.types';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import * as crypto from 'crypto';

@Injectable()
export class DatabaseService {
  private connectionPools: Map<string, Pool<DatabaseClient>> = new Map();

  constructor(
    @InjectModel(DATABASE_CONNECTION)
    private databaseConnectionModel: Model<DatabaseConnectionDocument>,
    private readonly configService: ConfigService,
    private readonly databaseClientFactory: DatabaseClientFactory,
  ) {}

  async createConnection(userId: string, createConnectionDto: CreateConnectionDto): Promise<DatabaseConnectionDocument> {
    const connection = new this.databaseConnectionModel({
      ...createConnectionDto,
      userId: Types.ObjectId.createFromHexString(userId),
    });
    return connection.save();
  }

  async getConnections(userId: string, paginationDto: PaginationDto): Promise<{ data: DatabaseConnectionDocument[]; total: number }> {
    const { page = 1, limit = 10, search } = paginationDto;
    const query: any = { userId: Types.ObjectId.createFromHexString(userId) };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const [data, total] = await Promise.all([
      this.databaseConnectionModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.databaseConnectionModel.countDocuments(query),
    ]);

    return { data, total };
  }

  async getConnection(userId: string, id: string): Promise<DatabaseConnectionDocument> {
    const connection = await this.databaseConnectionModel.findOne({
      _id: Types.ObjectId.createFromHexString(id),
      userId: Types.ObjectId.createFromHexString(userId),
    });

    if (!connection) {
      throw new NotFoundException('Database connection not found');
    }

    return connection;
  }

  async updateConnection(userId: string, id: string, updateConnectionDto: UpdateConnectionDto): Promise<DatabaseConnectionDocument> {
    const connection = await this.databaseConnectionModel.findOneAndUpdate(
      {
        _id: Types.ObjectId.createFromHexString(id),
        userId: Types.ObjectId.createFromHexString(userId),
      },
      { $set: updateConnectionDto },
      { new: true },
    );

    if (!connection) {
      throw new NotFoundException('Database connection not found');
    }

    // Clear connection pool if options were updated
    if (updateConnectionDto.options) {
      this.clearConnectionPool(id);
    }

    return connection;
  }

  async deleteConnection(userId: string, id: string): Promise<void> {
    const connection = await this.databaseConnectionModel.findOneAndDelete({
      _id: Types.ObjectId.createFromHexString(id),
      userId: Types.ObjectId.createFromHexString(userId),
    });

    if (!connection) {
      throw new NotFoundException('Database connection not found');
    }

    this.clearConnectionPool(id);
  }

  async testConnection(connection: DatabaseConnectionDocument): Promise<boolean> {
    try {
      const pool = await this.getConnectionPool(connection);
      const client = await pool.acquire();
      await pool.release(client);
      
      // Update last connected timestamp
      await this.databaseConnectionModel.findByIdAndUpdate(
        connection._id,
        {
          $set: {
            'metadata.lastConnected': new Date(),
          },
          $unset: {
            'metadata.lastError': 1,
          },
        },
        { new: true },
      );

      return true;
    } catch (error) {
      // Update error information
      await this.databaseConnectionModel.findByIdAndUpdate(
        connection._id,
        {
          $set: {
            'metadata.lastError': error.message,
          },
        },
        { new: true },
      );

      throw new BadRequestException(`Connection test failed: ${error.message}`);
    }
  }

  private async getConnectionPool(connection: DatabaseConnectionDocument): Promise<Pool<DatabaseClient>> {
    const poolKey = connection._id.toString();
    
    if (this.connectionPools.has(poolKey)) {
      return this.connectionPools.get(poolKey);
    }

    const client = await this.databaseClientFactory.createClient(connection.type, connection.options);
    const factory: Factory<DatabaseClient> = {
      create: async () => client,
      destroy: async (client) => {
        if (isMySQLClient(client) || isPostgreSQLClient(client)) {
          await client.end();
        } else if (isSQLServerClient(client)) {
          await client.close();
        } else if (isMongoDBClient(client)) {
          await client.close();
        }
      },
      validate: async (client) => {
        try {
          if (isMySQLClient(client) || isPostgreSQLClient(client) || isSQLServerClient(client)) {
            await client.query('SELECT 1');
          } else if (isMongoDBClient(client)) {
            await client.db().command({ ping: 1 });
          }
          return true;
        } catch {
          return false;
        }
      },
    };

    const options: Options = {
      min: 2,
      max: connection.options.poolSize || 10,
      idleTimeoutMillis: 30000,
    };

    const pool = createPool<DatabaseClient>(factory, options);
    this.connectionPools.set(poolKey, pool);
    return pool;
  }

  private clearConnectionPool(id: string): void {
    const pool = this.connectionPools.get(id);
    if (pool) {
      pool.drain().then(() => {
        this.connectionPools.delete(id);
      });
    }
  }

  async executeQuery(connection: DatabaseConnectionDocument, query: string, params: any[] = []): Promise<QueryResultType> {
    const pool = await this.getConnectionPool(connection);
    const client = await pool.acquire();

    try {
      if (isMySQLClient(client)) {
        const [rows, fields] = await client.query(query, params);
        return {
          rows: Array.isArray(rows) ? rows : [],
          rowCount: Array.isArray(rows) ? rows.length : 0,
          fields,
        };
      } else if (isPostgreSQLClient(client)) {
        const result = await client.query(query, params);
        return {
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields,
        };
      } else if (isSQLServerClient(client)) {
        const result = await client.request().query(query);
        return {
          recordset: result.recordset,
          rowsAffected: result.rowsAffected,
        };
      } else if (isMongoDBClient(client)) {
        const result = await client.db().command({ eval: query });
        return {
          result,
          ok: result.ok,
        };
      }
      throw new QueryError(`Unsupported database type: ${connection.type}`);
    } finally {
      await pool.release(client);
    }
  }

  async getSchemas(userId: string, id: string): Promise<string[]> {
    const connection = await this.getConnection(userId, id);
    const pool = await this.getConnectionPool(connection);

    try {
      const client = await pool.acquire();
      try {
        if (isMySQLClient(client) || isPostgreSQLClient(client)) {
          const result = await client.query(
            'SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN (\'information_schema\', \'pg_catalog\')'
          );
          return Array.isArray(result.rows) ? result.rows.map((row: any) => row.schema_name as string) : [];
        } else if (isSQLServerClient(client)) {
          const result = await client.request().query('SELECT name FROM sys.schemas');
          return result.recordset.map((row: any) => row.name as string);
        } else if (isMongoDBClient(client)) {
          const collections = await client.db().listCollections().toArray();
          return collections.map((col: any) => col.name as string);
        }
        throw new QueryError(`Unsupported database type: ${connection.type}`);
      } finally {
        await pool.release(client);
      }
    } catch (error) {
      throw new QueryError(`Failed to get schemas: ${error.message}`);
    }
  }

  async getTables(userId: string, id: string, schema?: string): Promise<string[]> {
    const connection = await this.getConnection(userId, id);
    const pool = await this.getConnectionPool(connection);

    try {
      const client = await pool.acquire();
      try {
        if (isMySQLClient(client)) {
          const [rows] = await client.query('SHOW TABLES');
          return Array.isArray(rows) ? rows.map((row: any) => Object.values(row)[0] as string) : [];
        } else if (isPostgreSQLClient(client)) {
          const result = await client.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = $1`,
            [schema || 'public']
          );
          return result.rows.map((row: any) => row.table_name as string);
        } else if (isSQLServerClient(client)) {
          const result = await client.request().query`
            SELECT name FROM sys.tables WHERE schema_id = SCHEMA_ID(${schema || 'dbo'})
          `;
          return result.recordset.map((row: any) => row.name as string);
        } else if (isMongoDBClient(client)) {
          const collections = await client.db().listCollections().toArray();
          return collections.map((col: any) => col.name as string);
        }
        throw new QueryError(`Unsupported database type: ${connection.type}`);
      } finally {
        await pool.release(client);
      }
    } catch (error) {
      throw new QueryError(`Failed to get tables: ${error.message}`);
    }
  }

  async getTableColumns(userId: string, id: string, tableName: string, schema?: string): Promise<any[]> {
    const connection = await this.getConnection(userId, id);
    const pool = await this.getConnectionPool(connection);

    try {
      const client = await pool.acquire();
      try {
        if (isMySQLClient(client)) {
          const [rows] = await client.query('SHOW COLUMNS FROM ??', [tableName]);
          return Array.isArray(rows) ? rows : [];
        } else if (isPostgreSQLClient(client)) {
          const result = await client.query(
            `SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_schema = $1 AND table_name = $2
             ORDER BY ordinal_position`,
            [schema || 'public', tableName]
          );
          return result.rows;
        } else if (isSQLServerClient(client)) {
          const result = await client.request().query`
            SELECT 
              c.name AS column_name,
              t.name AS data_type,
              c.is_nullable,
              c.default_object_id
            FROM sys.columns c
            INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
            WHERE OBJECT_ID = OBJECT_ID(${schema || 'dbo'}.${tableName})
          `;
          return result.recordset;
        } else if (isMongoDBClient(client)) {
          const sample = await client.db().collection(tableName).findOne();
          return Object.entries(sample || {}).map(([key, value]) => ({
            column_name: key,
            data_type: typeof value,
            is_nullable: true,
          }));
        }
        throw new QueryError(`Unsupported database type: ${connection.type}`);
      } finally {
        await pool.release(client);
      }
    } catch (error) {
      throw new QueryError(`Failed to get table columns: ${error.message}`);
    }
  }

  async getConnectionStatus(userId: string, id: string): Promise<{
    isConnected: boolean;
    lastConnected?: Date;
    lastError?: string;
  }> {
    const connection = await this.getConnection(userId, id);
    const pool = await this.getConnectionPool(connection);

    try {
      const client = await pool.acquire();
      try {
        if (isMySQLClient(client) || isPostgreSQLClient(client) || isSQLServerClient(client)) {
          await client.query('SELECT 1');
        } else if (isMongoDBClient(client)) {
          await client.db().command({ ping: 1 });
        }
        return {
          isConnected: true,
          lastConnected: new Date(),
        };
      } finally {
        await pool.release(client);
      }
    } catch (error) {
      return {
        isConnected: false,
        lastError: error.message,
      };
    }
  }

  async encryptConnection(userId: string, id: string): Promise<DatabaseConnectionDocument> {
    const connection = await this.getConnection(userId, id);
    if (connection.isEncrypted) {
      throw new BadRequestException('Connection is already encrypted');
    }

    const encryptionKey = crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16);

    // Encrypt sensitive data
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), iv);
    const encryptedPassword = Buffer.concat([
      cipher.update(connection.options.password, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Update connection with encrypted data
    connection.options.password = Buffer.concat([iv, authTag, encryptedPassword]).toString('base64');
    connection.isEncrypted = true;
    connection.encryptionKey = encryptionKey;

    return await connection.save();
  }

  async decryptConnection(userId: string, id: string): Promise<DatabaseConnectionDocument> {
    const connection = await this.getConnection(userId, id);
    if (!connection.isEncrypted) {
      throw new BadRequestException('Connection is not encrypted');
    }

    // Decrypt password
    const encryptedData = Buffer.from(connection.options.password, 'base64');
    const iv = encryptedData.slice(0, 16);
    const authTag = encryptedData.slice(16, 32);
    const encryptedPassword = encryptedData.slice(32);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(connection.encryptionKey, 'hex'),
      iv,
    );
    decipher.setAuthTag(authTag);

    const decryptedPassword = Buffer.concat([
      decipher.update(encryptedPassword),
      decipher.final(),
    ]).toString('utf8');

    // Update connection with decrypted data
    connection.options.password = decryptedPassword;
    connection.isEncrypted = false;
    connection.encryptionKey = undefined;

    return await connection.save();
  }
} 