import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { DatabaseModule } from './database/database.module';
import { QueryBuilderModule } from './query-builder/query-builder.module';
import { EventsModule } from './events/events.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/low-code-sql'),
    SharedModule,
    AuthModule,
    UsersModule,
    RolesModule,
    DatabaseModule,
    QueryBuilderModule,
    EventsModule,
  ],
})
export class AppModule {} 