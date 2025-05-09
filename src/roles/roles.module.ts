import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Role, RoleSchema } from './schemas/role.schema';
import { Permission, PermissionSchema } from './schemas/permission.schema';
import { RolePermission, RolePermissionSchema } from './schemas/role-permission.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UserRole, UserRoleSchema } from '../users/schemas/user-role.schema';
import { RoleRepository } from './repositories/role.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: User.name, schema: UserSchema },
      { name: UserRole.name, schema: UserRoleSchema },
    ]),
    forwardRef(() => SharedModule),
  ],
  controllers: [RolesController],
  providers: [RolesService, RoleRepository, PermissionRepository],
  exports: [RolesService, RoleRepository, PermissionRepository],
})
export class RolesModule {} 