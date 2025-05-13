import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AdminApiService } from './services/admin-api.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  providers: [AdminApiService],
  exports: [AdminApiService],
})
export class SharedModule {} 