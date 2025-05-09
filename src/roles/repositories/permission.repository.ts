import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Permission, PermissionDocument } from '../entities/permission.entity';
import { IPermissionRepository } from './permission.repository.interface';

@Injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionModel.find().exec();
  }

  async findById(id: string): Promise<Permission> {
    return this.permissionModel.findById(id).exec();
  }

  async findByName(name: string): Promise<Permission> {
    return this.permissionModel.findOne({ name }).exec();
  }

  async findByResourceAndAction(resource: string, action: string): Promise<Permission> {
    return this.permissionModel.findOne({ resource, action }).exec();
  }

  async create(permissionData: Partial<Permission>): Promise<Permission> {
    const createdPermission = new this.permissionModel(permissionData);
    return createdPermission.save();
  }

  async update(id: string, permissionData: Partial<Permission>): Promise<Permission> {
    return this.permissionModel
      .findByIdAndUpdate(id, permissionData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.permissionModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findActivePermissions(): Promise<Permission[]> {
    return this.permissionModel.find({ isActive: true }).exec();
  }

  async findPermissionsByResource(resource: string): Promise<Permission[]> {
    return this.permissionModel.find({ resource }).exec();
  }

  async findPermissionsByAction(action: string): Promise<Permission[]> {
    return this.permissionModel.find({ action }).exec();
  }

  async findPermissionsByResources(resources: string[]): Promise<Permission[]> {
    return this.permissionModel.find({ resource: { $in: resources } }).exec();
  }

  async findPermissionsByActions(actions: string[]): Promise<Permission[]> {
    return this.permissionModel.find({ action: { $in: actions } }).exec();
  }

  async updateConditions(id: string, conditions: Record<string, any>): Promise<Permission> {
    return this.permissionModel
      .findByIdAndUpdate(
        id,
        { $set: { conditions } },
        { new: true }
      )
      .exec();
  }

  async bulkCreate(permissions: Array<Required<Pick<Permission, 'name' | 'resource' | 'action'>> & Partial<Omit<Permission, 'name' | 'resource' | 'action' | '_id'>>>): Promise<Permission[]> {
    const createdPermissions = await this.permissionModel.insertMany(permissions);
    return createdPermissions.map(doc => doc.toObject()) as Permission[];
  }

  async bulkUpdate(updates: { id: string; data: Partial<Permission> }[]): Promise<Permission[]> {
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(update.id) },
        update: { $set: update.data }
      }
    }));
    
    await this.permissionModel.bulkWrite(bulkOps);
    return this.findByIds(updates.map(u => u.id));
  }

  private async findByIds(ids: string[]): Promise<Permission[]> {
    return this.permissionModel.find({
      _id: { $in: ids.map(id => new Types.ObjectId(id)) }
    }).exec();
  }
} 