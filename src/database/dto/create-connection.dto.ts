import { IsString, IsEnum, IsObject, IsOptional, IsNumber, Min, Max, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ConnectionOptions } from '../schemas/database-connection.schema';
import { DatabaseType } from '../types/database-clients.types';

export class ConnectionPoolOptions {
  @IsNumber()
  @Min(1)
  @Max(100)
  min: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  max: number;

  @IsNumber()
  @Min(1000)
  idleTimeoutMillis: number;
}

export class SslOptions {
  @IsOptional()
  @IsBoolean()
  rejectUnauthorized?: boolean;

  @IsOptional()
  @IsString()
  ca?: string;

  @IsOptional()
  @IsString()
  cert?: string;

  @IsOptional()
  @IsString()
  key?: string;
}

export class ConnectionOptionsDto implements ConnectionOptions {
  @IsString()
  host: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  database: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  ssl?: boolean;

  @IsOptional()
  @IsObject()
  @Type(() => SslOptions)
  sslOptions?: SslOptions;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  poolSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  connectionTimeout?: number;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  queryTimeout?: number;
}

export class CreateConnectionDto {
  @IsString()
  name: string;

  @IsEnum(DatabaseType)
  type: DatabaseType;

  @IsObject()
  @Type(() => ConnectionOptionsDto)
  options: ConnectionOptionsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsObject()
  @Type(() => ConnectionPoolOptions)
  connectionPool?: ConnectionPoolOptions;
} 