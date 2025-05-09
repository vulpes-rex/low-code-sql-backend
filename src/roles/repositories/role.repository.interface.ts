import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { User } from '../../users/entities/user.entity';

export interface IRoleRepository {
  findAll(): Promise<Role[]>;
  findById(id: string): Promise<Role>;
  findByName(name: string): Promise<Role>;
  create(roleData: Partial<Role>): Promise<Role>;
  update(id: string, roleData: Partial<Role>): Promise<Role>;
  delete(id: string): Promise<void>;
  assignPermission(roleId: string, permissionId: string): Promise<Role>;
  removePermission(roleId: string, permissionId: string): Promise<Role>;
  getRolePermissions(roleId: string): Promise<Permission[]>;
  getUsers(roleId: string): Promise<User[]>;
} 