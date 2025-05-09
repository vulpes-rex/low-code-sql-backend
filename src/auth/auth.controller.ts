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
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

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
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const result = await this.authService.validateOAuthLogin(req.user, 'google');
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}`);
  }

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Guard redirects to GitHub
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req, @Res() res: Response) {
    const result = await this.authService.validateOAuthLogin(req.user, 'github');
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}`);
  }

  @Public()
  @Get('saml')
  @UseGuards(AuthGuard('saml'))
  async samlAuth() {
    // Guard redirects to SAML IdP
  }

  @Public()
  @Get('saml/callback')
  @UseGuards(AuthGuard('saml'))
  async samlAuthCallback(@Req() req, @Res() res: Response) {
    const result = await this.authService.validateOAuthLogin(req.user, 'saml');
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${result.access_token}`);
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