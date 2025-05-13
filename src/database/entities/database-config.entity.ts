import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DatabaseType {
  MYSQL = 'mysql',
  POSTGRESQL = 'postgresql',
  MARIADB = 'mariadb',
  MONGODB = 'mongodb',
}

@Entity('database_configs')
export class DatabaseConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: DatabaseType,
    default: DatabaseType.POSTGRESQL,
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

  @Column({ default: 'public' })
  schema: string;

  @Column('jsonb', { nullable: true })
  options: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 