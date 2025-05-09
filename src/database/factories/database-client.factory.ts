import { Injectable } from '@nestjs/common';
import { DatabaseClient, DatabaseClientConfig, DatabaseType } from '../types/database-clients.types';
import * as mysql from 'mysql2/promise';
import * as mssql from 'mssql';
import { Pool as PgPool } from 'pg';
import { MongoClient } from 'mongodb';

@Injectable()
export class DatabaseClientFactory {
  async createClient(type: DatabaseType, config: DatabaseClientConfig): Promise<DatabaseClient> {
    switch (type) {
      case 'mysql':
        return mysql.createPool({
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.username,
          password: config.password,
          ssl: config.ssl ? config.sslOptions : undefined,
          waitForConnections: true,
          connectionLimit: config.poolSize || 10,
          queueLimit: 0,
        });

      case 'sqlserver':
        return new mssql.ConnectionPool({
          server: config.host,
          port: config.port,
          database: config.database,
          user: config.username,
          password: config.password,
          options: {
            encrypt: config.ssl,
            trustServerCertificate: !config.ssl,
            connectionTimeout: config.connectionTimeout || 30000,
            requestTimeout: config.queryTimeout || 30000,
          },
        }).connect();

      case 'postgresql':
        return new PgPool({
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.username,
          password: config.password,
          ssl: config.ssl ? config.sslOptions : undefined,
          max: config.poolSize || 10,
          connectionTimeoutMillis: config.connectionTimeout || 30000,
          idleTimeoutMillis: config.queryTimeout || 30000,
        });

      case 'mongodb':
        const uri = this.buildMongoUri(config);
        return MongoClient.connect(uri, {
          maxPoolSize: config.poolSize || 10,
          connectTimeoutMS: config.connectionTimeout || 30000,
          ssl: config.ssl,
          ...config.sslOptions,
        });

      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  private buildMongoUri(config: DatabaseClientConfig): string {
    const auth = `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}`;
    const host = `${config.host}:${config.port}`;
    return `mongodb://${auth}@${host}/${config.database}`;
  }
} 