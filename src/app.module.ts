import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SequelizeModule } from '@nestjs/sequelize';
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
      envFilePath: '.env',
      cache: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE');
        if (dbType === 'mongodb') {
          return {
            uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/low-code-sql'),
          };
        }
        return null;
      },
      inject: [ConfigService],
    }),
    SequelizeModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE');
        if (dbType === 'postgres' || dbType === 'mysql' || dbType === 'sqlite') {
          return {
            dialect: dbType,
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: configService.get<number>('DB_PORT', 5432),
            username: configService.get<string>('DB_USERNAME', 'postgres'),
            password: configService.get<string>('DB_PASSWORD', 'postgres'),
            database: configService.get<string>('DB_DATABASE', 'low_code_sql'),
            autoLoadModels: true,
            synchronize: true,
          };
        }
        return null;
      },
      inject: [ConfigService],
    }),
    SharedModule,
    AuthModule,
    UsersModule.forRoot(),
    RolesModule.forRoot(),
    DatabaseModule.forRoot(),
    QueryBuilderModule,
    EventsModule,
  ],
})
export class AppModule {} 