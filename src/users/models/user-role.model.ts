import { Column, Model, Table, DataType, ForeignKey } from 'sequelize-typescript';
import { User } from './user.model';
import { Role } from '../../roles/models/role.model';

@Table({
  tableName: 'user_roles',
  timestamps: true,
})
export class UserRole extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  userId: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  roleId: number;
} 