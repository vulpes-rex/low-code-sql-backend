import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { RoleRepository } from './repositories/role.repository';
import { PermissionRepository } from './repositories/permission.repository';
import { Role, RoleDocument } from './schemas/role.schema';
import { Permission, PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class RolesService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async create(roleData: { name: string; description?: string }): Promise<RoleDocument> {
    const existingRole = await this.roleRepository.findByName(roleData.name);
    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }
    return this.roleRepository.create(roleData);
  }

  async findById(id: number): Promise<RoleDocument | null> {
    return this.roleRepository.findById(id);
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.roleRepository.findByName(name);
  }

  async findAll(): Promise<RoleDocument[]> {
    return this.roleRepository.findAll();
  }

  async update(id: number, roleData: Partial<Role>): Promise<RoleDocument | null> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.roleRepository.update(id, roleData);
  }

  async delete(id: number): Promise<void> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    await this.roleRepository.delete(id);
  }

  async assignPermission(roleId: number, permissionId: number): Promise<RoleDocument | null> {
    const role = await this.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.roleRepository.addPermission(roleId, permissionId);
  }

  async removePermission(roleId: number, permissionId: number): Promise<RoleDocument | null> {
    const role = await this.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return this.roleRepository.removePermission(roleId, permissionId);
  }

  async getUserRoles(userId: string): Promise<RoleDocument[]> {
    // This will need to be implemented in the UserRepository
    throw new Error('Method not implemented');
  }

  async getRolePermissions(roles: RoleDocument[]): Promise<string[]> {
    const permissions = new Set<string>();
    for (const role of roles) {
      if (role.permissions) {
        for (const permission of role.permissions) {
          permissions.add(permission);
        }
      }
    }
    return Array.from(permissions);
  }

  async createPermission(permissionData: { name: string; description?: string }): Promise<PermissionDocument> {
    return this.permissionRepository.create(permissionData);
  }

  async findAllPermissions(): Promise<PermissionDocument[]> {
    return this.permissionRepository.findAll();
  }
} 