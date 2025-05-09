import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../entities/role.entity';
import { Permission, PermissionDocument } from '../entities/permission.entity';
import { User } from '../../users/entities/user.entity';
import { IRoleRepository } from './role.repository.interface';

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleModel.find().populate('permissions').exec();
  }

  async findById(id: string): Promise<Role> {
    return this.roleModel.findById(id).populate('permissions').exec();
  }

  async findByName(name: string): Promise<Role> {
    return this.roleModel.findOne({ name }).populate('permissions').exec();
  }

  async create(roleData: Partial<Role>): Promise<Role> {
    const role = new this.roleModel(roleData);
    return role.save();
  }

  async update(id: string, roleData: Partial<Role>): Promise<Role> {
    return this.roleModel.findByIdAndUpdate(id, roleData, { new: true }).populate('permissions').exec();
  }

  async delete(id: string): Promise<void> {
    await this.roleModel.findByIdAndDelete(id).exec();
  }

  async assignPermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.findById(roleId);
    if (!role) {
      return null;
    }
    const permission = await this.permissionModel.findById(permissionId);
    if (!permission) {
      return null;
    }
    if (!role.permissions.some(p => p.id === permissionId)) {
      role.permissions.push(permission);
      await role.save();
    }
    return this.findById(roleId);
  }

  async removePermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.findById(roleId);
    if (!role) {
      return null;
    }
    role.permissions = role.permissions.filter(p => p.id !== permissionId);
    await role.save();
    return this.findById(roleId);
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.findById(roleId);
    if (!role) {
      return [];
    }
    return role.permissions;
  }

  async getUsers(roleId: string): Promise<User[]> {
    const role = await this.findById(roleId);
    if (!role) {
      return [];
    }
    return role.users;
  }
} 