import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column('simple-array')
  roles: string[];

  @Column({ type: 'json', nullable: true })
  oauthTokens?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  samlData?: Record<string, any>;
} 