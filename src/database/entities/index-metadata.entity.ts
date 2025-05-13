import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { TableMetadata } from './table-metadata.entity';

@Entity()
export class IndexMetadata {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('simple-array')
  columns: string[];

  @Column()
  isUnique: boolean;

  @Column()
  isFulltext: boolean;

  @Column()
  isSpatial: boolean;

  @ManyToOne(() => TableMetadata, table => table.indexes)
  table: TableMetadata;
} 