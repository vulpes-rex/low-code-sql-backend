import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { QueryParameter } from './query-parameter.entity';

@Entity('saved_queries')
export class SavedQuery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('text')
  query: string;

  @Column()
  databaseConnectionId: number;

  @Column('jsonb')
  metadata: {
    tables: string[];
    joins: Array<{
      type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
      table: string;
      condition: string;
    }>;
    filters: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    sorting: Array<{
      field: string;
      direction: 'ASC' | 'DESC';
    }>;
    grouping: string[];
    aggregations: Array<{
      field: string;
      function: string;
      alias: string;
    }>;
  };

  @Column()
  createdBy: number;

  @Column({ default: true })
  isPublic: boolean;

  @OneToMany(() => QueryParameter, parameter => parameter.savedQuery)
  parameters: QueryParameter[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 