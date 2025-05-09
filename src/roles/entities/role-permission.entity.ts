import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Column, Model, Table, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Schema()
@Table
export class RolePermission extends Model {
  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  @ForeignKey(() => Role)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  roleId: string;

  @Prop({ type: Types.ObjectId, ref: 'Permission', required: true })
  @ForeignKey(() => Permission)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  permissionId: string;

  @BelongsTo(() => Role)
  role: Role;

  @BelongsTo(() => Permission)
  permission: Permission;
}

export type RolePermissionDocument = RolePermission & Document;
export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission); 