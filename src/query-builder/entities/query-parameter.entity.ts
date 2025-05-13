import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SavedQuery } from './saved-query.entity';

@Entity('query_parameters')
export class QueryParameter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';

  @Column({ nullable: true })
  defaultValue: string;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ nullable: true })
  validation: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => SavedQuery, savedQuery => savedQuery.parameters)
  @JoinColumn({ name: 'saved_query_id' })
  savedQuery: SavedQuery;

  @Column()
  savedQueryId: number;
} 