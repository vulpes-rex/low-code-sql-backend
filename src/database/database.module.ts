import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { DatabaseConfigService } from './services/database-config.service';
import { DefaultDatabaseService } from './services/default-database.service';
import { DatabaseConfig } from './entities/database-config.entity';
import { TableMetadata } from './entities/table-metadata.entity';
import { ColumnMetadata } from './entities/column-metadata.entity';
import { IndexMetadata } from './entities/index-metadata.entity';
import { ForeignKeyMetadata } from './entities/foreign-key-metadata.entity';
import { TableManagementService } from './services/table-management.service';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { DatabaseController } from './database.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const options: PostgresConnectionOptions = {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST') || 'localhost',
          port: parseInt(configService.get<string>('DATABASE_PORT') || '5432', 10),
          username: configService.get<string>('DATABASE_USERNAME') || 'postgres',
          password: configService.get<string>('DATABASE_PASSWORD') || 'postgres',
          database: configService.get<string>('DATABASE_NAME') || 'low_code_sql',
          schema: configService.get<string>('DATABASE_SCHEMA') || 'public',
          entities: [
            DatabaseConfig,
            TableMetadata,
            ColumnMetadata,
            IndexMetadata,
            ForeignKeyMetadata,
          ],
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          logging: configService.get<string>('NODE_ENV') === 'development',
        };
        return options;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      DatabaseConfig,
      TableMetadata,
      ColumnMetadata,
      IndexMetadata,
      ForeignKeyMetadata,
    ]),
  ],
  controllers: [DatabaseController],
  providers: [
    DatabaseService,
    DatabaseConfigService,
    DefaultDatabaseService,
    TableManagementService,
  ],
  exports: [
    DatabaseService,
    DatabaseConfigService,
    DefaultDatabaseService,
    TableManagementService,
  ],
})
export class DatabaseModule {} 