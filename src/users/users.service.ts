import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { IUserRepository } from './repositories/user.repository.interface';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.userRepository.update(id, updateUserDto);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.delete(id);
  }

  async findActiveUsers(): Promise<User[]> {
    return this.userRepository.findActiveUsers();
  }

  async findUsersByRole(roleId: string): Promise<User[]> {
    return this.userRepository.findUsersByRole(roleId);
  }

  async addRole(userId: string, roleId: string): Promise<User> {
    return this.userRepository.addRole(userId, roleId);
  }

  async removeRole(userId: string, roleId: string): Promise<User> {
    return this.userRepository.removeRole(userId, roleId);
  }

  async updatePassword(userId: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userRepository.updatePassword(userId, hashedPassword);
  }

  async updateMetadata(userId: string, metadata: Record<string, any>): Promise<User> {
    return this.userRepository.updateMetadata(userId, metadata);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async getUserRoles(userId: string): Promise<User> {
    return this.userRepository.findById(userId);
  }
} 