import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Column, Model, Table, DataType, ForeignKey } from 'sequelize-typescript';
import { User } from './user.entity';
import { Role } from '../../roles/entities/role.entity';

export type UserRoleDocument = UserRole & Document;

@Schema()
@Table({
  tableName: 'user_roles',
  timestamps: true,
})
export class UserRole extends Model<UserRole> {
  @Prop()
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Prop({ type: String, ref: 'User', required: true })
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId: string;

  @Prop({ type: String, ref: 'Role', required: true })
  @ForeignKey(() => Role)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  roleId: number;

  @Prop({ default: Date.now })
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  assignedAt: Date;
}

export const UserRoleSchema = SchemaFactory.createForClass(UserRole); 