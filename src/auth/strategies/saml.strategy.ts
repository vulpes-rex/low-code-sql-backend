import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-saml';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      entryPoint: configService.get<string>('SAML_ENTRY_POINT'),
      issuer: configService.get<string>('SAML_ISSUER'),
      callbackUrl: configService.get<string>('SAML_CALLBACK_URL'),
      cert: configService.get<string>('SAML_CERT'),
      identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
    });
  }

  async validate(profile: any): Promise<any> {
    const user = await this.authService.findOrCreateUser({
      email: profile.email,
      name: profile.displayName,
      provider: 'saml',
      providerId: profile.nameID,
    });

    return user;
  }
} 