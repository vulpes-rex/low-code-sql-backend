import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from '../schemas/role.schema';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<RoleDocument>,
  ) {}

  async findAll(): Promise<RoleDocument[]> {
    return this.roleModel.find().exec();
  }

  async findById(id: number): Promise<RoleDocument | null> {
    return this.roleModel.findById(id).exec();
  }

  async findByName(name: string): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name }).exec();
  }

  async create(roleData: Partial<Role>): Promise<RoleDocument> {
    const newRole = new this.roleModel(roleData);
    return newRole.save();
  }

  async update(id: number, roleData: Partial<Role>): Promise<RoleDocument | null> {
    return this.roleModel
      .findByIdAndUpdate(id, roleData, { new: true })
      .exec();
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.roleModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    return result.deletedCount > 0;
  }

  async addPermission(roleId: number, permissionId: number): Promise<RoleDocument | null> {
    return this.roleModel
      .findByIdAndUpdate(
        roleId,
        { $addToSet: { permissions: permissionId } },
        { new: true }
      )
      .exec();
  }

  async removePermission(roleId: number, permissionId: number): Promise<RoleDocument | null> {
    return this.roleModel
      .findByIdAndUpdate(
        roleId,
        { $pull: { permissions: permissionId } },
        { new: true }
      )
      .exec();
  }

  async findRolesByPermission(permissionId: string): Promise<RoleDocument[]> {
    return this.roleModel.find({ permissions: permissionId }).exec();
  }

  async findActiveRoles(): Promise<RoleDocument[]> {
    return this.roleModel.find({ isActive: true }).exec();
  }

  async findRolesByTags(tags: string[]): Promise<RoleDocument[]> {
    return this.roleModel.find({ tags: { $in: tags } }).exec();
  }
} 