import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DataSourceOptions } from 'typeorm';
import { DatabaseConfig, DatabaseType } from '../entities/database-config.entity';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

@Injectable()
export class DatabaseConfigService {
  constructor(
    @InjectRepository(DatabaseConfig)
    private readonly databaseConfigRepository: Repository<DatabaseConfig>,
    private readonly dataSource: DataSource,
  ) {}

  async create(config: Partial<DatabaseConfig>): Promise<DatabaseConfig> {
    const newConfig = this.databaseConfigRepository.create(config);
    return this.databaseConfigRepository.save(newConfig);
  }

  async findAll(): Promise<DatabaseConfig[]> {
    return this.databaseConfigRepository.find();
  }

  async findById(id: string): Promise<DatabaseConfig> {
    const config = await this.databaseConfigRepository.findOne({ where: { id } });
    if (!config) {
      throw new BadRequestException(`Database configuration with id ${id} not found`);
    }
    return config;
  }

  async update(id: string, config: Partial<DatabaseConfig>): Promise<DatabaseConfig> {
    await this.databaseConfigRepository.update(id, config);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    const config = await this.findById(id);
    await this.databaseConfigRepository.remove(config);
  }

  async getConnectionStatus(id: string): Promise<{ status: string; message?: string }> {
    try {
      const config = await this.findById(id);
      const dataSource = await this.getDataSource();
      return { status: 'connected' };
    } catch (error) {
      return { status: 'disconnected', message: error.message };
    }
  }

  async getDataSource(id?: string): Promise<DataSource> {
    if (id) {
      const config = await this.findById(id);
      const dataSourceOptions = this.createDataSourceOptions(config);
      const dataSource = new DataSource(dataSourceOptions);
      await dataSource.initialize();
      return dataSource;
    }
    
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
    return this.dataSource;
  }

  private createDataSourceOptions(config: DatabaseConfig): DataSourceOptions {
    switch (config.type) {
      case DatabaseType.POSTGRESQL:
        return this.createPostgresOptions(config);
      case DatabaseType.MYSQL:
      case DatabaseType.MARIADB:
        return this.createMysqlOptions(config);
      case DatabaseType.MONGODB:
        throw new BadRequestException('MongoDB is not supported with TypeORM');
      default:
        throw new BadRequestException(`Unsupported database type: ${config.type}`);
    }
  }

  private createPostgresOptions(config: DatabaseConfig): PostgresConnectionOptions {
    return {
      type: 'postgres',
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database,
      schema: config.schema,
      ...config.options,
    };
  }

  private createMysqlOptions(config: DatabaseConfig): MysqlConnectionOptions {
    return {
      type: config.type === DatabaseType.MARIADB ? 'mariadb' : 'mysql',
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database,
      ...config.options,
    };
  }
} 