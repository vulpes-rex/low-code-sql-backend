import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminUserService } from '../admin-api/services/user.service';
import { User } from '../user/schemas/user.schema';
import { OAuthProvider } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly adminUserService: AdminUserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.adminUserService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Note: Password validation should be handled by the admin service
    return user;
  }

  async login(user: User) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.adminUserService.findById(decoded.sub);
      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      this.jwtService.verify(token);
      return true;
    } catch {
      return false;
    }
  }

  async validateOAuthLogin(user: any, provider: OAuthProvider): Promise<User> {
    const existingUser = await this.adminUserService.findByEmail(user.email);
    if (!existingUser) {
      throw new UnauthorizedException('User not found');
    }
    return existingUser;
  }

  async validateOAuthToken(token: string, provider: OAuthProvider): Promise<User> {
    // OAuth token validation should be handled by the admin service
    throw new UnauthorizedException('OAuth not supported in read-only mode');
  }

  async validateSamlResponse(samlResponse: any): Promise<User> {
    // SAML validation should be handled by the admin service
    throw new UnauthorizedException('SAML not supported in read-only mode');
  }

  async validatePermissions(user: User, requiredRoles: string[]): Promise<boolean> {
    return requiredRoles.some(role => user.roles.includes(role));
  }
} 