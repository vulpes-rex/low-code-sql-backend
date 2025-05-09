import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  exports: [SharedModule],
})
export class UsersModule {} 