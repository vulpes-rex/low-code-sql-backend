import { Module, DynamicModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { Role, RoleSchema } from '../roles/entities/role.entity';
import { Permission, PermissionSchema } from '../roles/entities/permission.entity';
import { RolePermission, RolePermissionSchema } from '../roles/entities/role-permission.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { RoleRepository } from '../roles/repositories/role.repository';
import { PermissionRepository } from '../roles/repositories/permission.repository';
import { UserRepository } from '../users/repositories/user.repository';
import { RoleSequelizeRepository } from '../roles/repositories/role.sequelize.repository';
import { PermissionSequelizeRepository } from '../roles/repositories/permission.sequelize.repository';
import { UserSequelizeRepository } from '../users/repositories/user.sequelize.repository';
import { DatabaseService } from './database.service';
import { DatabaseClientFactory } from './factories/database-client.factory';
import { DATABASE_CONNECTION, DatabaseConnectionSchema } from './schemas/database-connection.schema';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          useFactory: (configService: ConfigService) => ({
            uri: configService.get<string>('MONGODB_URI'),
          }),
          inject: [ConfigService],
        }),
        SequelizeModule.forRootAsync({
          useFactory: (configService: ConfigService) => ({
            dialect: 'postgres',
            host: configService.get<string>('DB_HOST'),
            port: configService.get<number>('DB_PORT'),
            username: configService.get<string>('DB_USERNAME'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_DATABASE'),
            autoLoadModels: true,
            synchronize: true,
          }),
          inject: [ConfigService],
        }),
        MongooseModule.forFeature([
          { name: Role.name, schema: RoleSchema },
          { name: Permission.name, schema: PermissionSchema },
          { name: RolePermission.name, schema: RolePermissionSchema },
          { name: User.name, schema: UserSchema },
          { name: DATABASE_CONNECTION, schema: DatabaseConnectionSchema },
        ]),
        SequelizeModule.forFeature([Role, Permission, RolePermission, User]),
      ],
      providers: [
        DatabaseService,
        DatabaseClientFactory,
        {
          provide: 'RoleRepository',
          useFactory: (configService: ConfigService, roleModel: any, permissionModel: any, rolePermissionModel: any) => {
            return configService.get<string>('DB_TYPE') === 'mongodb'
              ? new RoleRepository(roleModel, permissionModel)
              : new RoleSequelizeRepository(roleModel, permissionModel, rolePermissionModel);
          },
          inject: [ConfigService, 'RoleModel', 'PermissionModel', 'RolePermissionModel'],
        },
        {
          provide: 'PermissionRepository',
          useFactory: (configService: ConfigService, permissionModel: any) => {
            return configService.get<string>('DB_TYPE') === 'mongodb'
              ? new PermissionRepository(permissionModel)
              : new PermissionSequelizeRepository(permissionModel);
          },
          inject: [ConfigService, 'PermissionModel'],
        },
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
          provide: 'RoleModel',
          useFactory: (configService: ConfigService) => {
            return configService.get<string>('DB_TYPE') === 'mongodb'
              ? Role.name
              : Role;
          },
          inject: [ConfigService],
        },
        {
          provide: 'PermissionModel',
          useFactory: (configService: ConfigService) => {
            return configService.get<string>('DB_TYPE') === 'mongodb'
              ? Permission.name
              : Permission;
          },
          inject: [ConfigService],
        },
        {
          provide: 'RolePermissionModel',
          useFactory: (configService: ConfigService) => {
            return configService.get<string>('DB_TYPE') === 'mongodb'
              ? RolePermission.name
              : RolePermission;
          },
          inject: [ConfigService],
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
      exports: [DatabaseService, 'RoleRepository', 'PermissionRepository', 'UserRepository'],
    };
  }
} 