import { IsString, IsNumber, IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DatabaseType } from '../entities/database-config.entity';

export class DatabaseOptionsDto {
  @IsOptional()
  @IsObject()
  ssl?: boolean;

  @IsOptional()
  @IsNumber()
  maxConnections?: number;

  @IsOptional()
  @IsNumber()
  idleTimeoutMillis?: number;

  @IsOptional()
  @IsNumber()
  connectionTimeoutMillis?: number;

  @IsOptional()
  @IsString()
  schema?: string;

  @IsOptional()
  @IsString()
  authSource?: string;

  @IsOptional()
  @IsString()
  authMechanism?: string;
}

export class CreateDatabaseConfigDto {
  @IsString()
  name: string;

  @IsEnum(DatabaseType)
  type: DatabaseType;

  @IsString()
  host: string;

  @IsNumber()
  port: number;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  database: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DatabaseOptionsDto)
  options?: DatabaseOptionsDto;
} 