import { Injectable } from '@nestjs/common';
import { InjectModel as InjectMongooseModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUserRepository } from './user.repository.interface';
import { User } from '../entities/user.entity';
import { Role } from '../../roles/entities/role.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectMongooseModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<User> {
    return this.userModel.findOne({ username }).exec();
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    return this.userModel.findByIdAndUpdate(id, userData, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findActiveUsers(): Promise<User[]> {
    return this.userModel.find({ isActive: true }).exec();
  }

  async findUsersByRole(roleId: string): Promise<User[]> {
    return this.userModel.find({ roles: roleId }).exec();
  }

  async addRole(userId: string, roleId: string): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { roles: roleId } },
      { new: true },
    ).exec();
  }

  async removeRole(userId: string, roleId: string): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { roles: roleId } },
      { new: true },
    ).exec();
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true },
    ).exec();
  }

  async updateMetadata(userId: string, metadata: Record<string, any>): Promise<User> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { metadata },
      { new: true },
    ).exec();
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const user = await this.userModel.findById(userId).populate('roles').exec();
    return user?.roles || [];
  }
} 