import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { IUserRepository } from '../users/repositories/user.repository.interface';
import { IRoleRepository } from './repositories/role.repository.interface';
import { IPermissionRepository } from './repositories/permission.repository.interface';

@Injectable()
export class RolesService {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('PermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async create(roleData: { name: string; description?: string }): Promise<Role> {
    const existingRole = await this.roleRepository.findByName(roleData.name);
    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }
    return this.roleRepository.create(roleData);
  }

  async findById(id: string): Promise<Role> {
    return this.roleRepository.findById(id);
  }

  async findByName(name: string): Promise<Role> {
    return this.roleRepository.findByName(name);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }

  async update(id: string, roleData: Partial<Role>): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.roleRepository.update(id, roleData);
  }

  async delete(id: string): Promise<void> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    await this.roleRepository.delete(id);
  }

  async assignPermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.roleRepository.assignPermission(roleId, permissionId);
  }

  async removePermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.roleRepository.removePermission(roleId, permissionId);
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userRepository.getUserRoles(userId);
  }

  async getRolePermissions(roles: Role[]): Promise<string[]> {
    const permissions = new Set<string>();
    for (const role of roles) {
      const rolePermissions = await this.roleRepository.getRolePermissions(role.id);
      for (const permission of rolePermissions) {
        permissions.add(permission.id);
      }
    }
    return Array.from(permissions);
  }

  async createPermission(permissionData: { name: string; description?: string }): Promise<Permission> {
    return this.permissionRepository.create(permissionData);
  }

  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.findAll();
  }
} 