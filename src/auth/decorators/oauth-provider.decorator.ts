import { SetMetadata } from '@nestjs/common';
import { OAUTH_PROVIDER_KEY } from '../guards/oauth-provider.guard';

export type OAuthProvider = 'google' | 'github' | 'facebook' | 'okta' | 'auth0';

export const OAuthProvider = (provider: OAuthProvider) =>
  SetMetadata(OAUTH_PROVIDER_KEY, provider); 