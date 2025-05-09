import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Permission } from '../entities/permission.entity';
import { IPermissionRepository } from './permission.repository.interface';

@Injectable()
export class PermissionSequelizeRepository implements IPermissionRepository {
  constructor(
    @InjectModel(Permission)
    private readonly permissionModel: typeof Permission,
  ) {}

  async findById(id: string): Promise<Permission> {
    return this.permissionModel.findByPk(id);
  }

  async findByName(name: string): Promise<Permission> {
    return this.permissionModel.findOne({ where: { name } });
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionModel.findAll();
  }

  async create(permissionData: Partial<Permission>): Promise<Permission> {
    return this.permissionModel.create(permissionData);
  }

  async update(id: string, permissionData: Partial<Permission>): Promise<Permission> {
    const permission = await this.findById(id);
    if (!permission) {
      return null;
    }
    return permission.update(permissionData);
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.permissionModel.destroy({
      where: { id },
    });
    return deleted > 0;
  }

  async findByResourceAndAction(resource: string, action: string): Promise<Permission> {
    return this.permissionModel.findOne({
      where: { resource, action },
    });
  }
} 