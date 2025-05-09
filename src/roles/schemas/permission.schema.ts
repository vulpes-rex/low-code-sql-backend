import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  resource: string;

  @Prop({ required: true })
  action: string;

  @Prop({ type: Object })
  conditions?: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  metadata?: {
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    lastModified?: Date;
  };
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

// Add indexes
PermissionSchema.index({ name: 1 }, { unique: true });
PermissionSchema.index({ resource: 1, action: 1 }, { unique: true }); 