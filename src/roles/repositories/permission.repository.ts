import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Permission, PermissionDocument } from '../schemas/permission.schema';

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async findAll(): Promise<PermissionDocument[]> {
    return this.permissionModel.find().exec();
  }

  async findById(id: string): Promise<PermissionDocument | null> {
    return this.permissionModel.findById(id).exec();
  }

  async findByName(name: string): Promise<PermissionDocument | null> {
    return this.permissionModel.findOne({ name }).exec();
  }

  async findByResourceAndAction(resource: string, action: string): Promise<PermissionDocument | null> {
    return this.permissionModel.findOne({ resource, action }).exec();
  }

  async create(permissionData: Partial<Permission>): Promise<PermissionDocument> {
    const newPermission = new this.permissionModel(permissionData);
    return newPermission.save();
  }

  async update(id: string, permissionData: Partial<Permission>): Promise<PermissionDocument | null> {
    return this.permissionModel
      .findByIdAndUpdate(id, permissionData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.permissionModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    return result.deletedCount > 0;
  }

  async findActivePermissions(): Promise<PermissionDocument[]> {
    return this.permissionModel.find({ isActive: true }).exec();
  }

  async findPermissionsByResource(resource: string): Promise<PermissionDocument[]> {
    return this.permissionModel.find({ resource }).exec();
  }

  async findPermissionsByAction(action: string): Promise<PermissionDocument[]> {
    return this.permissionModel.find({ action }).exec();
  }

  async findPermissionsByResources(resources: string[]): Promise<PermissionDocument[]> {
    return this.permissionModel.find({ resource: { $in: resources } }).exec();
  }

  async findPermissionsByActions(actions: string[]): Promise<PermissionDocument[]> {
    return this.permissionModel.find({ action: { $in: actions } }).exec();
  }

  async updateConditions(id: string, conditions: Record<string, any>): Promise<PermissionDocument | null> {
    return this.permissionModel
      .findByIdAndUpdate(
        id,
        { $set: { conditions } },
        { new: true }
      )
      .exec();
  }

  async bulkCreate(permissions: Array<Required<Pick<Permission, 'name' | 'resource' | 'action'>> & Partial<Omit<Permission, 'name' | 'resource' | 'action' | '_id'>>>): Promise<PermissionDocument[]> {
    const createdPermissions = await this.permissionModel.insertMany(permissions);
    return createdPermissions.map(doc => doc.toObject()) as PermissionDocument[];
  }

  async bulkUpdate(updates: { id: string; data: Partial<Permission> }[]): Promise<PermissionDocument[]> {
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(update.id) },
        update: { $set: update.data }
      }
    }));
    
    await this.permissionModel.bulkWrite(bulkOps);
    return this.findByIds(updates.map(u => u.id));
  }

  private async findByIds(ids: string[]): Promise<PermissionDocument[]> {
    return this.permissionModel.find({
      _id: { $in: ids.map(id => new Types.ObjectId(id)) }
    }).exec();
  }
} 