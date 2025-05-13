import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DatabaseConnection } from './database-connection.entity';

@Entity()
export class SQLTableVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tableName: string;

  @Column()
  version: number;

  @Column('json')
  schema: Record<string, any>;

  @Column('json', { nullable: true })
  data: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => DatabaseConnection)
  @JoinColumn()
  database: DatabaseConnection;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 