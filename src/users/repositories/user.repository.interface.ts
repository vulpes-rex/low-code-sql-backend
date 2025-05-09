import { User } from '../entities/user.entity';
import { Role } from '../../roles/entities/role.entity';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  findByUsername(username: string): Promise<User>;
  create(userData: Partial<User>): Promise<User>;
  update(id: string, userData: Partial<User>): Promise<User>;
  delete(id: string): Promise<boolean>;
  findActiveUsers(): Promise<User[]>;
  findUsersByRole(roleId: string): Promise<User[]>;
  addRole(userId: string, roleId: string): Promise<User>;
  removeRole(userId: string, roleId: string): Promise<User>;
  updatePassword(userId: string, hashedPassword: string): Promise<User>;
  updateMetadata(userId: string, metadata: Record<string, any>): Promise<User>;
  getUserRoles(userId: string): Promise<Role[]>;
} 