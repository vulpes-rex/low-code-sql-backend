import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { DatabaseType } from '../types/database-clients.types';

@Entity()
export class DatabaseConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: DatabaseType,
  })
  type: DatabaseType;

  @Column()
  host: string;

  @Column()
  port: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column()
  database: string;

  @Column({ type: 'json', nullable: true })
  ssl?: {
    enabled: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };

  @Column({ type: 'json', nullable: true })
  options?: Record<string, any>;
} 