import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConnection } from '../database/schemas/database-connection.schema';
import { DataService } from './data.service';
import { DataController } from './data.controller';
import { DatabaseModule } from '../database/database.module';
import { QueryBuilderModule } from '../query-builder/query-builder.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DatabaseConnection]),
    DatabaseModule,
    QueryBuilderModule,
  ],
  controllers: [DataController],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {} 