import { Injectable } from '@nestjs/common';
import { MongoClient, Db, ObjectId } from 'mongodb';
import { DatabaseClient, DatabaseConnectionOptions } from '../types/database-clients.types';

@Injectable()
export class MongoDBClient implements DatabaseClient {
  private client: MongoClient;
  private db: Db;

  constructor(private readonly options: DatabaseConnectionOptions) {
    const url = `mongodb://${options.username}:${options.password}@${options.host}:${options.port}/${options.database}`;
    this.client = new MongoClient(url, {
      ssl: options.ssl?.enabled || false,
      sslValidate: options.ssl?.enabled || false
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db();
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  async query(collection: string, query: any = {}, options: any = {}): Promise<any> {
    return this.db.collection(collection).find(query, options).toArray();
  }

  async getTables(): Promise<string[]> {
    return this.db.listCollections().toArray().then(collections => 
      collections.map(collection => collection.name)
    );
  }

  async getColumns(collectionName: string): Promise<any[]> {
    const sample = await this.db.collection(collectionName).findOne();
    if (!sample) return [];

    const columns = Object.entries(sample).map(([key, value]) => ({
      column_name: key,
      data_type: this.getMongoType(value),
      is_nullable: true,
      column_default: null,
      is_primary: key === '_id'
    }));

    return columns;
  }

  async getIndexes(collectionName: string): Promise<any[]> {
    const indexes = await this.db.collection(collectionName).indexes();
    return indexes.map(index => ({
      index_name: index.name,
      columns: Object.keys(index.key),
      is_unique: index.unique || false
    }));
  }

  async getForeignKeys(collectionName: string): Promise<any[]> {
    // MongoDB doesn't have built-in foreign key constraints
    // This would need to be implemented at the application level
    return [];
  }

  async executeTransaction(operations: any[]): Promise<void> {
    const session = this.client.startSession();
    try {
      await session.withTransaction(async () => {
        for (const operation of operations) {
          const { collection, type, ...params } = operation;
          switch (type) {
            case 'insert':
              await this.db.collection(collection).insertOne(params.document, { session });
              break;
            case 'update':
              await this.db.collection(collection).updateOne(
                params.filter,
                params.update,
                { session }
              );
              break;
            case 'delete':
              await this.db.collection(collection).deleteOne(params.filter, { session });
              break;
          }
        }
      });
    } finally {
      await session.endSession();
    }
  }

  private getMongoType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (value instanceof ObjectId) return 'objectId';
    return typeof value;
  }
} 