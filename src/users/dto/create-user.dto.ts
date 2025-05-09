import { IsEmail, IsString, IsOptional, MinLength, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'provider123' })
  @IsString()
  @IsOptional()
  providerId?: string;

  @ApiPropertyOptional({ example: 'Google' })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: { preferences: { theme: 'dark' } } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
} 