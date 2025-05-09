import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatabaseType } from '../types/database-clients.types';

export interface ConnectionOptions {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  sslOptions?: {
    rejectUnauthorized?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  poolSize?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
}

export const DATABASE_CONNECTION = 'DatabaseConnection' as const;

@Schema({ timestamps: true, collection: 'database_connections' })
export class DatabaseConnection {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Object.values(DatabaseType) })
  type: DatabaseType;

  @Prop({ required: true, type: Object })
  options: ConnectionOptions;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object })
  metadata?: {
    lastConnected?: Date;
    lastError?: string;
    version?: string;
    tables?: string[];
    schemas?: string[];
  };

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Object })
  connectionPool?: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
  };

  @Prop({ type: Boolean, default: false })
  isEncrypted: boolean;

  @Prop({ type: String })
  encryptionKey?: string;
}

export type DatabaseConnectionDocument = DatabaseConnection & Document;

export const DatabaseConnectionSchema = SchemaFactory.createForClass(DatabaseConnection);

// Add indexes
DatabaseConnectionSchema.index({ userId: 1, name: 1 }, { unique: true });
DatabaseConnectionSchema.index({ type: 1 });
DatabaseConnectionSchema.index({ tags: 1 });

// Add validation
DatabaseConnectionSchema.pre('save', function(next) {
  if (this.isModified('options')) {
    // Validate required fields
    const requiredFields = ['host', 'port', 'database', 'username', 'password'];
    for (const field of requiredFields) {
      if (!this.options[field]) {
        next(new Error(`Missing required field: ${field}`));
        return;
      }
    }

    // Validate port range
    if (this.options.port < 1 || this.options.port > 65535) {
      next(new Error('Port must be between 1 and 65535'));
      return;
    }

    // Validate pool size if provided
    if (this.options.poolSize && (this.options.poolSize < 1 || this.options.poolSize > 100)) {
      next(new Error('Pool size must be between 1 and 100'));
      return;
    }
  }
  next();
}); 