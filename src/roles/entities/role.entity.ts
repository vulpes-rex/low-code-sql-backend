import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Column, Model, Table, DataType, BelongsToMany } from 'sequelize-typescript';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/user-role.entity';

export type RoleDocument = Role & Document;

@Schema()
@Table({
  tableName: 'roles',
  timestamps: true,
})
export class Role extends Model<Role> {
  @Prop()
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

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
  description?: string;

  @Prop({ type: [{ type: String, ref: 'Permission' }] })
  @BelongsToMany(() => Permission, () => RolePermission)
  permissions: Permission[];

  @Prop({ type: [{ type: String, ref: 'User' }] })
  @BelongsToMany(() => User, () => UserRole)
  users: User[];

  @Prop({ default: Date.now })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: Date;

  @Prop({ default: Date.now })
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  updatedAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive: boolean;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata: Record<string, any>;
}

export const RoleSchema = SchemaFactory.createForClass(Role); 