import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryBuilderService } from './query-builder.service';
import { QueryParserService } from './services/query-parser.service';
import { QueryOptimizerService } from './services/query-optimizer.service';
import { QueryValidatorService } from './services/query-validator.service';
import { DatabaseModule } from '../database/database.module';
import { SharedModule } from '../shared/shared.module';
import { SavedQuery } from './entities/saved-query.entity';
import { QueryParameter } from './entities/query-parameter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedQuery, QueryParameter]),
    DatabaseModule,
    SharedModule
  ],
  providers: [
    QueryBuilderService,
    QueryParserService,
    QueryOptimizerService,
    QueryValidatorService
  ],
  exports: [QueryBuilderService],
})
export class QueryBuilderModule {} 