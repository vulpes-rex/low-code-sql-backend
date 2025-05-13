import { Injectable } from '@nestjs/common';
import { DatabaseType, DatabaseConnectionOptions, DatabaseClient } from './types/database-clients.types';
import { MySQLClient } from './clients/mysql.client';
import { PostgreSQLClient } from './clients/postgresql.client';
import { SQLiteClient } from './clients/sqlite.client';
import { MSSQLClient } from './clients/mssql.client';
import { MongoDBClient } from './clients/mongodb.client';

@Injectable()
export class DatabaseClientFactory {
  createClient(type: DatabaseType, options: DatabaseConnectionOptions): DatabaseClient {
    switch (type) {
      case DatabaseType.MYSQL:
        return new MySQLClient(options);
      case DatabaseType.POSTGRESQL:
        return new PostgreSQLClient(options);
      case DatabaseType.SQLITE:
        return new SQLiteClient(options);
      case DatabaseType.MSSQL:
        return new MSSQLClient(options);
      case DatabaseType.MONGODB:
        return new MongoDBClient(options);
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }
} 