import { Module } from '@nestjs/common';
import { QueryBuilderService } from './query-builder.service';
import { QueryBuilderController } from './query-builder.controller';
import { DatabaseModule } from '../database/database.module';
import { QueryParserService } from './services/query-parser.service';
import { QueryOptimizerService } from './services/query-optimizer.service';
import { QueryValidatorService } from './services/query-validator.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    QueryBuilderService,
    QueryParserService,
    QueryOptimizerService,
    QueryValidatorService,
  ],
  controllers: [QueryBuilderController],
  exports: [QueryBuilderService],
})
export class QueryBuilderModule {} 