import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { OAuthProvider } from '../auth/types/auth.types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByOAuthToken(token: string, provider: OAuthProvider): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        oauthTokens: {
          [provider]: token,
        },
      },
    });
  }

  async findBySamlResponse(samlResponse: any): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        samlData: {
          responseId: samlResponse.id,
        },
      },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    if (userData.password) {
      userData.password = await this.hashPassword(userData.password);
    }
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
} 