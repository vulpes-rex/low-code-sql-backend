import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserValidationPipe } from './pipes/user-validation.pipe';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @UsePipes(UserValidationPipe)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, description: 'Return the user.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles('admin')
  @UsePipes(UserValidationPipe)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User successfully updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('active')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all active users' })
  @ApiResponse({ status: 200, description: 'Return all active users.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findActive() {
    return this.usersService.findActiveUsers();
  }

  @Get('role/:roleId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get users by role' })
  @ApiResponse({ status: 200, description: 'Return users with the specified role.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findByRole(@Param('roleId') roleId: string) {
    return this.usersService.findUsersByRole(roleId);
  }

  @Post(':userId/roles/:roleId')
  @Roles('admin')
  @ApiOperation({ summary: 'Add role to user' })
  @ApiResponse({ status: 200, description: 'Role successfully added to user.' })
  @ApiResponse({ status: 404, description: 'User or role not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  addRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.usersService.addRole(userId, roleId);
  }

  @Delete(':userId/roles/:roleId')
  @Roles('admin')
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiResponse({ status: 200, description: 'Role successfully removed from user.' })
  @ApiResponse({ status: 404, description: 'User or role not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.usersService.removeRole(userId, roleId);
  }

  @Patch(':id/password')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Password successfully updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  updatePassword(
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    return this.usersService.updatePassword(id, password);
  }

  @Patch(':id/metadata')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user metadata' })
  @ApiResponse({ status: 200, description: 'Metadata successfully updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  updateMetadata(
    @Param('id') id: string,
    @Body('metadata') metadata: Record<string, any>,
  ) {
    return this.usersService.updateMetadata(id, metadata);
  }
} 