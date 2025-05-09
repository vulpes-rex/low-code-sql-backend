import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { User } from '../../users/entities/user.entity';
import { Op } from 'sequelize';
import { IRoleRepository } from './role.repository.interface';

@Injectable()
export class RoleSequelizeRepository implements IRoleRepository {
  constructor(
    @InjectModel(Role)
    private readonly roleModel: typeof Role,
    @InjectModel(Permission)
    private readonly permissionModel: typeof Permission,
    @InjectModel(RolePermission)
    private readonly rolePermissionModel: typeof RolePermission,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleModel.findAll({
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });
  }

  async findById(id: string): Promise<Role> {
    return this.roleModel.findByPk(id, {
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });
  }

  async findByName(name: string): Promise<Role> {
    return this.roleModel.findOne({
      where: { name },
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });
  }

  async create(roleData: Partial<Role>): Promise<Role> {
    return this.roleModel.create(roleData);
  }

  async update(id: string, roleData: Partial<Role>): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      return null;
    }
    await role.update(roleData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const role = await this.findById(id);
    if (role) {
      await role.destroy();
    }
  }

  async findActiveRoles(): Promise<Role[]> {
    return this.roleModel.findAll({
      where: { isActive: true },
      include: [Permission],
    });
  }

  async assignPermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.findById(roleId);
    if (!role) {
      return null;
    }
    await role.$add('permissions', permissionId);
    return this.findById(roleId);
  }

  async removePermission(roleId: string, permissionId: string): Promise<Role> {
    const role = await this.findById(roleId);
    if (!role) {
      return null;
    }
    await role.$remove('permissions', permissionId);
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

  async updateMetadata(roleId: number, metadata: Record<string, any>): Promise<[number, Role[]]> {
    return this.roleModel.update(
      { metadata },
      {
        where: { id: roleId },
        returning: true,
      }
    );
  }

  async bulkCreate(roles: Partial<Role>[]): Promise<Role[]> {
    return this.roleModel.bulkCreate(roles);
  }

  async bulkUpdate(updates: { id: number; data: Partial<Role> }[]): Promise<[number, Role[]]> {
    const ids = updates.map(update => update.id);
    
    // Process updates one by one since bulk update with different values isn't directly supported
    const results = await Promise.all(
      updates.map(update =>
        this.roleModel.update(update.data, {
          where: { id: update.id },
          returning: true,
        })
      )
    );

    // Combine results
    const totalUpdated = results.reduce((sum, [count]) => sum + count, 0);
    const updatedRoles = (await this.roleModel.findAll({
      where: { id: { [Op.in]: ids } },
      include: [Permission],
    })) as Role[];

    return [totalUpdated, updatedRoles];
  }

  async findRolesByPermission(permissionId: number): Promise<Role[]> {
    return this.roleModel.findAll({
      include: [{
        model: Permission,
        where: { id: permissionId },
      }],
    });
  }

  async findRolesByUser(userId: number): Promise<Role[]> {
    return this.roleModel.findAll({
      include: [{
        model: User,
        where: { id: userId },
      }],
    });
  }
} 