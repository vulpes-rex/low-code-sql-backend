import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { DatabaseModule } from '../database/database.module';
import { RoleSequelizeRepository } from './repositories/role.sequelize.repository';
import { RoleRepository } from './repositories/role.repository';
import { Role, RoleSchema } from './entities/role.entity';
import { Permission, PermissionSchema } from './entities/permission.entity';
import { RolePermission, RolePermissionSchema } from './entities/role-permission.entity';
import { SharedModule } from '../shared/shared.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({})
export class RolesModule {
  static forRoot(): DynamicModule {
    return {
      module: RolesModule,
      imports: [
        ConfigModule,
        SharedModule,
        DatabaseModule.forRoot(),
        MongooseModule.forFeature([
          { name: Role.name, schema: RoleSchema },
          { name: Permission.name, schema: PermissionSchema },
          { name: RolePermission.name, schema: RolePermissionSchema },
        ]),
        SequelizeModule.forFeature([Role, Permission, RolePermission]),
      ],
      controllers: [RolesController],
      providers: [
        RolesService,
        RolesGuard,
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
      ],
      exports: [RolesService, RolesGuard],
    };
  }
} 