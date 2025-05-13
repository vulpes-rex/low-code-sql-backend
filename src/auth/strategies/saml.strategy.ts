import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-saml';
import { AuthService } from '../auth.service';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
  constructor(private readonly authService: AuthService) {
    super({
      entryPoint: process.env.SAML_ENTRY_POINT,
      issuer: process.env.SAML_ISSUER,
      callbackUrl: process.env.SAML_CALLBACK_URL,
      cert: process.env.SAML_CERT,
    });
  }

  async validate(profile: any) {
    try {
      const user = await this.authService.validateSamlResponse(profile);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid SAML credentials');
    }
  }
} 