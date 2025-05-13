import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { AuthService } from '../auth.service';
import { OAuthProvider } from '../types/auth.types';

@Injectable()
export class OAuthStrategy extends PassportStrategy(Strategy, 'oauth2') {
  constructor(private readonly authService: AuthService) {
    super({
      authorizationURL: process.env.OAUTH_AUTH_URL,
      tokenURL: process.env.OAUTH_TOKEN_URL,
      clientID: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      callbackURL: process.env.OAUTH_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    try {
      const user = await this.authService.validateOAuthToken(accessToken, OAuthProvider.GOOGLE);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid OAuth credentials');
    }
  }
} 