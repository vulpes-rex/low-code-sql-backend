import { SAML } from 'passport-saml';

declare module 'passport-saml' {
  interface SAML {
    validate(
      samlResponse: string,
      callback: (err: Error | null, profile: any) => void
    ): void;
  }
} 