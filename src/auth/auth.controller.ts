import { Controller, Post, Body, UseGuards, Get, Req, Res, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OAuthGuard } from './guards/oauth-auth.guard';
import { OAuthProviderGuard } from './guards/oauth-provider.guard';
import { SamlAuthGuard } from './guards/saml-auth.guard';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { OAuthProvider } from './decorators/oauth-provider.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Public()
  @Get('google')
  @UseGuards(OAuthGuard)
  async googleAuth() {
    // This route initiates Google OAuth flow
  }

  @Public()
  @Get('google/callback')
  @UseGuards(OAuthGuard)
  async googleAuthCallback(@Req() req, @Res() res) {
    const result = await this.authService.login(req.user);
    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.accessToken}`);
  }

  @Public()
  @Get('oauth/:provider')
  @UseGuards(OAuthProviderGuard)
  @OAuthProvider('google')
  async oauthAuth(@Req() req) {
    // This route initiates OAuth flow for the specified provider
  }

  @Public()
  @Get('oauth/:provider/callback')
  @UseGuards(OAuthProviderGuard)
  @OAuthProvider('google')
  async oauthCallback(@Req() req, @Res() res) {
    const result = await this.authService.login(req.user);
    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.accessToken}`);
  }

  @Public()
  @Get('saml')
  @UseGuards(SamlAuthGuard)
  async samlAuth() {
    // This route initiates SAML authentication flow
  }

  @Public()
  @Post('saml/callback')
  @UseGuards(SamlAuthGuard)
  async samlCallback(@Req() req, @Res() res) {
    const result = await this.authService.login(req.user);
    // Redirect to frontend with tokens
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.accessToken}`);
  }

  @Public()
  @Post('oauth/token')
  async validateOAuthToken(
    @Body('token') token: string,
    @Body('provider') provider: string,
  ) {
    const user = await this.authService.validateOAuthToken(token, provider);
    return this.authService.login(user);
  }

  @Public()
  @Post('saml/validate')
  async validateSamlResponse(@Body('samlResponse') samlResponse: string) {
    const user = await this.authService.validateSamlResponse(samlResponse);
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('users')
  async getUsers() {
    // This is an example of a protected route that requires admin role
    return { message: 'This route is protected by admin role' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('developer')
  @Get('permissions')
  async checkPermissions(@Req() req, @Body('permissions') permissions: string[]) {
    const hasPermissions = await this.authService.validatePermissions(
      req.user,
      permissions,
    );
    return { hasPermissions };
  }
} 