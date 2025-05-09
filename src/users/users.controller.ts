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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  async create(@Body() userData: {
    email: string;
    username: string;
    password?: string;
    name?: string;
    provider?: string;
    providerId?: string;
  }) {
    return this.usersService.create(userData);
  }

  @Get()
  @Roles('admin')
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: Partial<any>,
  ) {
    return this.usersService.update(id, userData);
  }

  @Delete(':id')
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }

  @Post(':userId/roles/:roleId')
  @Roles('admin')
  async assignRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.usersService.assignRole(userId, roleId);
  }

  @Delete(':userId/roles/:roleId')
  @Roles('admin')
  async removeRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roleId', ParseIntPipe) roleId: number,
  ) {
    return this.usersService.removeRole(userId, roleId);
  }
} 