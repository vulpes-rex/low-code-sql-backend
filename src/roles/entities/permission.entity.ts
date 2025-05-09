import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Column, Model, Table, DataType, BelongsToMany } from 'sequelize-typescript';
import { Role } from './role.entity';

@Schema()
@Table
export class Permission extends Model {
  @Prop({ required: true, unique: true })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  name: string;

  @Prop()
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description: string;

  @Prop({ type: String, required: true })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  resource: string;

  @Prop({ type: String, required: true })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  action: string;

  @Prop({ default: true })
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive: boolean;

  @Prop({ type: Object })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata: Record<string, any>;

  @BelongsToMany(() => Role, 'RolePermission', 'permissionId', 'roleId')
  roles: Role[];
}

export type PermissionDocument = Permission & Document;
export const PermissionSchema = SchemaFactory.createForClass(Permission); 