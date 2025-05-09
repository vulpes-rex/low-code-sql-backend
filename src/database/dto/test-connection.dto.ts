import { IsString, IsEnum, IsObject, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ConnectionOptions } from '../schemas/database-connection.schema';
import { DatabaseType } from '../types/database-clients.types';

export class TestConnectionDto {
  @IsEnum(['postgres', 'mysql', 'sqlserver', 'mongodb'])
  type: DatabaseType;

  @IsObject()
  @Type(() => ConnectionOptionsDto)
  options: ConnectionOptions;
}

class ConnectionOptionsDto implements ConnectionOptions {
  @IsString()
  host: string;

  @IsString()
  port: number;

  @IsString()
  database: string;

  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsOptional()
  ssl?: boolean;

  @IsOptional()
  sslOptions?: {
    rejectUnauthorized?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };

  @IsOptional()
  poolSize?: number;

  @IsOptional()
  connectionTimeout?: number;

  @IsOptional()
  queryTimeout?: number;
} 