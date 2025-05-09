import { Column, Model, Table, DataType, BelongsToMany } from 'sequelize-typescript';
import { Permission } from './permission.model';
import { RolePermission } from './role-permission.model';
import { User } from '../../users/models/user.model';
import { UserRole } from '../../users/models/user-role.model';

@Table({
  tableName: 'roles',
  timestamps: true,
})
export class Role extends Model {
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
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  description: string;

  @BelongsToMany(() => Permission, () => RolePermission)
  permissions: Permission[];

  @BelongsToMany(() => User, () => UserRole)
  users: User[];
} 