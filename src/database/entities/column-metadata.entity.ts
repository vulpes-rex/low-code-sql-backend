import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { TableMetadata } from './table-metadata.entity';

@Entity()
export class ColumnMetadata {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  isNullable: boolean;

  @Column()
  isPrimary: boolean;

  @Column()
  isUnique: boolean;

  @Column({ nullable: true })
  defaultValue: string;

  @Column({ nullable: true })
  length: string;

  @Column({ nullable: true })
  precision: number;

  @Column({ nullable: true })
  scale: number;

  @Column({ nullable: true })
  comment: string;

  @ManyToOne(() => TableMetadata, table => table.columns)
  table: TableMetadata;
} 