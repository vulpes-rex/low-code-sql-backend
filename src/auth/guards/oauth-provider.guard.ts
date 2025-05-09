import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

export const OAUTH_PROVIDER_KEY = 'oauthProvider';

@Injectable()
export class OAuthProviderGuard extends AuthGuard('oauth') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const provider = this.reflector.get<string>(
      OAUTH_PROVIDER_KEY,
      context.getHandler(),
    );

    if (!provider) {
      return false;
    }

    // Set the provider in the request for the strategy to use
    const request = context.switchToHttp().getRequest();
    request.oauthProvider = provider;

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new Error('OAuth authentication failed');
    }
    return user;
  }
} 