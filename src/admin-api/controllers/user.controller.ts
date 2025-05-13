import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminUserService } from '../services/user.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  async findAll() {
    return this.adminUserService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminUserService.findById(id);
  }

  @Get('username/:username')
  async findByUsername(@Param('username') username: string) {
    return this.adminUserService.findByUsername(username);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return this.adminUserService.findByEmail(email);
  }
} 