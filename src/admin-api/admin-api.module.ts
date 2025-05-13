import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/schemas/user.schema';
import { AdminUserService } from './services/user.service';
import { AdminUserController } from './controllers/user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AdminUserController],
  providers: [AdminUserService],
  exports: [AdminUserService],
})
export class AdminApiModule {} 