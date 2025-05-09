import { Permission } from '../entities/permission.entity';

export interface IPermissionRepository {
  findById(id: string): Promise<Permission>;
  findByName(name: string): Promise<Permission>;
  findAll(): Promise<Permission[]>;
  create(permissionData: Partial<Permission>): Promise<Permission>;
  update(id: string, permissionData: Partial<Permission>): Promise<Permission>;
  delete(id: string): Promise<boolean>;
  findByResourceAndAction(resource: string, action: string): Promise<Permission>;
} 