import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/env.validation';
import databaseConfig from './config/database.config';
import { DatabaseModule } from './database/database.module';
import { QueryBuilderModule } from './query-builder/query-builder.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [databaseConfig],
      envFilePath: ['.env.local', '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      cache: true,
    }),
    DatabaseModule,
    QueryBuilderModule,
    SharedModule,
  ],
})
export class AppModule {} 