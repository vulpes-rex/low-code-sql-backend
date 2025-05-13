import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { TableMetadata } from './table-metadata.entity';

@Entity()
export class ForeignKeyMetadata {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  columnName: string;

  @Column()
  referencedTableName: string;

  @Column()
  referencedColumnName: string;

  @Column()
  onDelete: string;

  @Column()
  onUpdate: string;

  @ManyToOne(() => TableMetadata, table => table.foreignKeys)
  table: TableMetadata;
} 