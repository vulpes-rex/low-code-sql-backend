import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UserRole, UserRoleSchema } from '../users/schemas/user-role.schema';
import { Role, RoleSchema } from '../roles/schemas/role.schema';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { LocalStrategy } from '../auth/strategies/local.strategy';
import { OAuthStrategy } from '../auth/strategies/oauth.strategy';
import { SamlStrategy } from '../auth/strategies/saml.strategy';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserRole.name, schema: UserRoleSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => RolesModule),
  ],
  providers: [
    UsersService,
    AuthService,
    JwtStrategy,
    LocalStrategy,
    {
      provide: OAuthStrategy,
      useFactory: (configService: ConfigService, authService: AuthService) => {
        const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
        const callbackUrl = configService.get<string>('GOOGLE_CALLBACK_URL');
        
        if (clientId && clientSecret && callbackUrl) {
          return new OAuthStrategy(configService, authService);
        }
        return null;
      },
      inject: [ConfigService, AuthService],
    },
    {
      provide: SamlStrategy,
      useFactory: (configService: ConfigService, authService: AuthService) => {
        const cert = configService.get<string>('SAML_CERT');
        const entryPoint = configService.get<string>('SAML_ENTRY_POINT');
        const issuer = configService.get<string>('SAML_ISSUER');
        const callbackUrl = configService.get<string>('SAML_CALLBACK_URL');
        
        if (cert && entryPoint && issuer && callbackUrl) {
          return new SamlStrategy(configService, authService);
        }
        return null;
      },
      inject: [ConfigService, AuthService],
    },
  ],
  exports: [
    UsersService,
    AuthService,
    MongooseModule,
    PassportModule,
    JwtModule,
    RolesModule,
  ],
})
export class SharedModule {} 