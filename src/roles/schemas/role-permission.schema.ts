import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from './role.schema';
import { Permission } from './permission.schema';

export type RolePermissionDocument = RolePermission & Document;

@Schema({ timestamps: true })
export class RolePermission {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Permission', required: true })
  permissionId: Types.ObjectId;

  @Prop({ type: Object })
  conditions?: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  grantedBy: Types.ObjectId;

  @Prop({ type: Date })
  grantedAt: Date;
}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);

// Add indexes
RolePermissionSchema.index({ roleId: 1, permissionId: 1 }, { unique: true }); 