import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { DatabaseModule } from '../database/database.module';
import { QueryBuilderModule } from '../query-builder/query-builder.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
    DatabaseModule,
    QueryBuilderModule
  ],
  providers: [EventsGateway, EventsService],
  exports: [EventsService],
})
export class EventsModule {} 