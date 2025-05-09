import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { SAML } from 'passport-saml';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import * as bcrypt from 'bcrypt';

interface BaseProfile {
  email: string;
  provider: string;
}

interface OAuthProfile extends BaseProfile {
  name?: string;
  picture?: string;
  providerId: string;
}

interface SamlProfile extends BaseProfile {
  displayName?: string;
  nameID?: string;
}

interface UserProfile extends BaseProfile {
  name?: string;
  providerId?: string;
}

function isOAuthProfile(profile: OAuthProfile | SamlProfile): profile is OAuthProfile {
  return 'providerId' in profile;
}

function isSamlProfile(profile: OAuthProfile | SamlProfile): profile is SamlProfile {
  return 'nameID' in profile;
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;
  private readonly samlStrategy?: SAML;

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Initialize Google OAuth client
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    );

    // Initialize SAML strategy only if all required config is present
    const samlCert = this.configService.get<string>('SAML_CERT');
    const samlEntryPoint = this.configService.get<string>('SAML_ENTRY_POINT');
    const samlIssuer = this.configService.get<string>('SAML_ISSUER');
    const samlCallbackUrl = this.configService.get<string>('SAML_CALLBACK_URL');

    if (samlCert && samlEntryPoint && samlIssuer && samlCallbackUrl) {
      this.samlStrategy = new SAML({
        entryPoint: samlEntryPoint,
        issuer: samlIssuer,
        callbackUrl: samlCallbackUrl,
        cert: samlCert,
      });
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await this.usersService.validatePassword(user, password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.create(createUserDto);
    const defaultRole = await this.rolesService.findByName('user');
    if (defaultRole) {
      await this.usersService.addRole(user.id, defaultRole.id);
    }

    const { password, ...result } = user;
    return result;
  }

  async validateOAuthLogin(profile: any, provider: string) {
    try {
      let user = await this.usersService.findByEmail(profile.email);

      if (!user) {
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        const userData: CreateUserDto = {
          email: profile.email,
          username: profile.username || profile.email.split('@')[0],
          password: hashedPassword,
          name: profile.name,
          providerId: profile.id,
          provider: provider,
        };

        user = await this.usersService.create(userData);
        const defaultRole = await this.rolesService.findByName('user');
        if (defaultRole) {
          await this.usersService.addRole(user.id, defaultRole.id);
        }
      } else {
        const updateData: UpdateUserDto = {
          providerId: profile.id,
          provider: provider,
        };
        await this.usersService.update(user.id, updateData);
      }

      user = await this.usersService.findById(user.id);
      return this.login(user);
    } catch (err) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateOAuthToken(token: string, provider: string) {
    switch (provider) {
      case 'google':
        return this.validateGoogleToken(token);
      case 'okta':
        return this.validateOktaToken(token);
      case 'auth0':
        return this.validateAuth0Token(token);
      default:
        throw new BadRequestException('Unsupported OAuth provider');
    }
  }

  private async validateGoogleToken(token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token payload');
      }
      return this.findOrCreateUser({
        email: payload.email || '',
        name: payload.name,
        picture: payload.picture,
        provider: 'google',
        providerId: payload.sub || '',
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private async validateOktaToken(token: string) {
    // Implement Okta token validation
    throw new Error('Not implemented');
  }

  private async validateAuth0Token(token: string) {
    // Implement Auth0 token validation
    throw new Error('Not implemented');
  }

  async validateSamlResponse(samlResponse: string) {
    if (!this.samlStrategy) {
      throw new BadRequestException('SAML authentication is not configured');
    }

    try {
      const profile = await new Promise<SamlProfile>((resolve, reject) => {
        this.samlStrategy!.validate(samlResponse, (err, profile: SamlProfile) => {
          if (err) {
            reject(err);
          } else {
            resolve(profile);
          }
        });
      });

      return this.findOrCreateUser({
        email: profile.email,
        name: profile.displayName,
        provider: 'saml',
        providerId: profile.nameID,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid SAML response');
    }
  }

  async findOrCreateUser(profile: OAuthProfile | SamlProfile) {
    try {
      // First, try to find the user by email
      let user = await this.usersService.findByEmail(profile.email);

      if (!user) {
        // If user doesn't exist, create a new one
        const username = this.generateUsername(profile.email);
        const userData: UserProfile = {
          email: profile.email,
          provider: profile.provider,
          name: isOAuthProfile(profile) ? profile.name : profile.displayName,
          providerId: isOAuthProfile(profile) ? profile.providerId : profile.nameID,
        };

        user = await this.usersService.create({
          ...userData,
          username,
          password: Math.random().toString(36).slice(-8), // Generate a random password
        });

        // Assign default role to new user
        const defaultRole = await this.rolesService.findByName('user');
        if (defaultRole) {
          await this.usersService.addRole(user.id, defaultRole.id);
        }
      } else if (user.provider !== profile.provider) {
        // If user exists but with a different provider, update the provider info
        const updateData: Partial<UserProfile> = {
          provider: profile.provider,
          providerId: isOAuthProfile(profile) ? profile.providerId : profile.nameID,
        };
        await this.usersService.update(user.id, updateData);
      }

      // Refresh user data with roles
      user = await this.usersService.findById(user.id);
      return user;
    } catch (error) {
      throw new BadRequestException('Failed to find or create user');
    }
  }

  private generateUsername(email: string): string {
    // Remove domain part and special characters
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    
    // Add random number to ensure uniqueness
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${baseUsername}${randomSuffix}`;
  }

  private async generateAccessToken(payload: any): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION', '1h'),
    });
  }

  private async generateRefreshToken(payload: any): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });
  }

  async validatePermissions(user: any, requiredPermissions: string[]): Promise<boolean> {
    const userRoles = await this.rolesService.getUserRoles(user.id);
    const userPermissions = await this.rolesService.getRolePermissions(userRoles);
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }
} 