import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { DatabaseConnectionSchema, DATABASE_CONNECTION } from './schemas/database-connection.schema';
import { DatabaseClientFactory } from './factories/database-client.factory';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DATABASE_CONNECTION, schema: DatabaseConnectionSchema },
    ]),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService, DatabaseClientFactory],
  exports: [DatabaseService],
})
export class DatabaseModule {} 