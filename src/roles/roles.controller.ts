import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  async create(@Body() roleData: { name: string; description?: string }) {
    return this.rolesService.create(roleData);
  }

  @Get()
  @Roles('admin')
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findById(id);
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() roleData: Partial<any>,
  ) {
    return this.rolesService.update(id, roleData);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.delete(id);
  }

  @Post(':roleId/permissions/:permissionId')
  @Roles('admin')
  async assignPermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolesService.assignPermission(roleId, permissionId);
  }

  @Delete(':roleId/permissions/:permissionId')
  @Roles('admin')
  async removePermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolesService.removePermission(roleId, permissionId);
  }

  @Get('permissions')
  @Roles('admin')
  async findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post('permissions')
  @Roles('admin')
  async createPermission(
    @Body() permissionData: { name: string; description?: string },
  ) {
    return this.rolesService.createPermission(permissionData);
  }
} 