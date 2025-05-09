import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './entities/user.entity';
import { UserRole, UserRoleSchema } from './entities/user-role.entity';
import { IUserRepository } from './repositories/user.repository.interface';
import { UserSequelizeRepository } from './repositories/user.sequelize.repository';
import { UserRepository } from './repositories/user.repository';
import { SharedModule } from '../shared/shared.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({})
export class UsersModule {
  static forRoot(): DynamicModule {
    return {
      module: UsersModule,
      imports: [
        ConfigModule,
        SharedModule,
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
          { name: UserRole.name, schema: UserRoleSchema },
        ]),
        SequelizeModule.forFeature([User, UserRole]),
      ],
      controllers: [UsersController],
      providers: [
        UsersService,
        RolesGuard,
        {
          provide: 'UserRepository',
          useFactory: (configService: ConfigService, userModel: any) => {
            return configService.get<string>('DB_TYPE') === 'mongodb'
              ? new UserRepository(userModel)
              : new UserSequelizeRepository(userModel);
          },
          inject: [ConfigService, 'UserModel'],
        },
        {
          provide: 'UserModel',
          useFactory: (configService: ConfigService) => {
            return configService.get<string>('DB_TYPE') === 'mongodb'
              ? User.name
              : User;
          },
          inject: [ConfigService],
        },
      ],
      exports: [UsersService],
    };
  }
} 