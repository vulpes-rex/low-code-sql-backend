import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/roles/models/role.model';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  provider: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [Number], default: [] })
  roles: number[];

  @Prop({ type: Object })
  metadata?: {
    lastLogin?: Date;
    lastPasswordChange?: Date;
    failedLoginAttempts?: number;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true }); 