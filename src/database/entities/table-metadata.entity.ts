import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class TableMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tableName: string;

  @Column()
  schema: string;

  @Column('json')
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: any;
    isPrimary: boolean;
    isUnique: boolean;
    isIndexed: boolean;
  }[];

  @Column('json')
  indexes: {
    name: string;
    columns: string[];
    isUnique: boolean;
  }[];

  @Column('json')
  foreignKeys: {
    name: string;
    columns: string[];
    referencedTable: string;
    referencedColumns: string[];
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 