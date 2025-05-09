import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../entities/user.entity';
import { Role } from '../../roles/entities/role.entity';
import { IUserRepository } from './user.repository.interface';

@Injectable()
export class UserSequelizeRepository implements IUserRepository {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.findAll({
      include: [Role],
    });
  }

  async findById(id: string): Promise<User> {
    return this.userModel.findByPk(id, {
      include: [Role],
    });
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({
      where: { email },
      include: [Role],
    });
  }

  async findByUsername(username: string): Promise<User> {
    return this.userModel.findOne({
      where: { username },
      include: [Role],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    return this.userModel.create(userData);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }
    await user.update(userData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.userModel.destroy({
      where: { id },
    });
    return deleted > 0;
  }

  async findActiveUsers(): Promise<User[]> {
    return this.userModel.findAll({
      where: { isActive: true },
      include: [Role],
    });
  }

  async findUsersByRole(roleId: string): Promise<User[]> {
    return this.userModel.findAll({
      include: [
        {
          model: Role,
          where: { id: roleId },
        },
      ],
    });
  }

  async addRole(userId: string, roleId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }
    await user.$add('roles', roleId);
    return this.findById(userId);
  }

  async removeRole(userId: string, roleId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      return null;
    }
    await user.$remove('roles', roleId);
    return this.findById(userId);
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    return this.update(userId, { password: hashedPassword });
  }

  async updateMetadata(userId: string, metadata: Record<string, any>): Promise<User> {
    return this.update(userId, { metadata });
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const user = await this.findById(userId);
    if (!user) {
      return [];
    }
    return user.roles;
  }
} 