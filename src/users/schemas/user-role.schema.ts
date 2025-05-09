import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';
import { Role } from '../../roles/schemas/role.schema';

export type UserRoleDocument = UserRole & Document;

@Schema({ timestamps: true })
export class UserRole {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId: Types.ObjectId;

  @Prop({ type: Date })
  assignedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedBy: Types.ObjectId;
}

export const UserRoleSchema = SchemaFactory.createForClass(UserRole);

// Add indexes
UserRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true }); 