import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  metadata?: {
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    lastModified?: Date;
  };
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Add indexes
RoleSchema.index({ name: 1 }, { unique: true }); 