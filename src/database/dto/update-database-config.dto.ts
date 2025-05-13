import { PartialType } from '@nestjs/mapped-types';
import { CreateDatabaseConfigDto } from './create-database-config.dto';

export class UpdateDatabaseConfigDto extends PartialType(CreateDatabaseConfigDto) {} 