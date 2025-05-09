import { Column, Model, Table, DataType, ForeignKey } from 'sequelize-typescript';
import { Role } from './role.model';
import { Permission } from './permission.model';

@Table({
  tableName: 'role_permissions',
  timestamps: true,
})
export class RolePermission extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  roleId: number;

  @ForeignKey(() => Permission)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  permissionId: number;
} 