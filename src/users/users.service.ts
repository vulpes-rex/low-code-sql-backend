import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Role } from '../roles/schemas/role.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async create(userData: {
    email: string;
    username: string;
    password?: string;
    name?: string;
    provider?: string;
    providerId?: string;
  }): Promise<UserDocument> {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = userData.password
      ? await bcrypt.hash(userData.password, 10)
      : null;

    const newUser = new this.userModel({
      ...userData,
      password: hashedPassword,
    });

    return newUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: number): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async validatePassword(user: UserDocument, password: string): Promise<boolean> {
    if (!user.password) {
      return false;
    }
    return bcrypt.compare(password, user.password);
  }

  async update(id: number, userData: Partial<User>): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    Object.assign(user, userData);
    return user.save();
  }

  async delete(id: number): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async assignRole(userId: number, roleId: number): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.roles.includes(roleId)) {
      user.roles.push(roleId);
      await user.save();
    }

    return this.findById(userId);
  }

  async removeRole(userId: number, roleId: number): Promise<UserDocument> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.roles = user.roles.filter(role => role !== roleId);
    await user.save();

    return this.findById(userId);
  }
} 