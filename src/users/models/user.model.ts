import { Column, Model, Table, DataType, BelongsToMany } from 'sequelize-typescript';
import { Role } from '../../roles/models/role.model';
import { UserRole } from './user-role.model';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  username: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  password: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  provider: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  providerId: string;

  @BelongsToMany(() => Role, () => UserRole)
  roles: Role[];
} 