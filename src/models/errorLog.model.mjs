import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ErrorLog = sequelize.define('ErrorLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    stack_trace: { type: DataTypes.TEXT, allowNull: true },
    route: { type: DataTypes.TEXT, allowNull: true },
    environment: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'error_logs',
    timestamps: false,
  });

  return ErrorLog;
};
