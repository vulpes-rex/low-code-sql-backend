import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DatabaseConnection } from './database-connection.entity';

@Entity()
export class DatabaseAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string;

  @Column()
  tableName: string;

  @Column('json', { nullable: true })
  oldData: Record<string, any>;

  @Column('json', { nullable: true })
  newData: Record<string, any>;

  @Column()
  userId: string;

  @ManyToOne(() => DatabaseConnection)
  @JoinColumn()
  database: DatabaseConnection;

  @CreateDateColumn()
  createdAt: Date;
} 