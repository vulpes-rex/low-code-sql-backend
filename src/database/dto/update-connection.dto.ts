import { IsString, IsEnum, IsObject, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { DatabaseType } from '../types/database-clients.types';
import { ConnectionOptions } from '../schemas/database-connection.schema';
import { SslOptions } from './create-connection.dto';

export class ConnectionMetadata {
  @IsOptional()
  @IsString()
  lastError?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tables?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  schemas?: string[];
}

export class UpdateConnectionOptionsDto implements Partial<ConnectionOptions> {
  @IsOptional()
  @IsString()
  host?: string;

  @IsOptional()
  @IsNumber()
  port?: number;

  @IsOptional()
  @IsString()
  database?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsBoolean()
  ssl?: boolean;

  @IsOptional()
  @IsObject()
  @Type(() => SslOptions)
  sslOptions?: SslOptions;

  @IsOptional()
  @IsNumber()
  poolSize?: number;

  @IsOptional()
  @IsNumber()
  connectionTimeout?: number;

  @IsOptional()
  @IsNumber()
  queryTimeout?: number;
}

export class UpdateConnectionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(DatabaseType)
  type?: DatabaseType;

  @IsOptional()
  @IsObject()
  @Type(() => UpdateConnectionOptionsDto)
  options?: Partial<ConnectionOptions>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  @Type(() => ConnectionMetadata)
  metadata?: ConnectionMetadata;
} 