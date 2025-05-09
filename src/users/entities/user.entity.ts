import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Column, Model, Table, DataType, BelongsToMany } from 'sequelize-typescript';
import { Role } from '../../roles/entities/role.entity';
import { UserRole } from './user-role.entity';

export type UserDocument = User & Document;

@Schema()
@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model<User> {
  @Prop()
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Prop({ required: true })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  username: string;

  @Prop({ required: true, unique: true })
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email: string;

  @Prop({ required: true })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Prop()
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  name?: string;

  @Prop()
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  providerId?: string;

  @Prop()
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  provider?: string;

  @Prop({ type: [{ type: String, ref: 'Role' }] })
  @BelongsToMany(() => Role, () => UserRole)
  roles: Role[];

  @Prop({ type: Object })
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata?: Record<string, any>;

  @Prop({ default: true })
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive: boolean;

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
}

export const UserSchema = SchemaFactory.createForClass(User); 