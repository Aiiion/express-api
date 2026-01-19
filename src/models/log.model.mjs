import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Log = sequelize.define('Log', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ip: { type: DataTypes.TEXT },
    route: { type: DataTypes.TEXT },
    description: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.ENUM('DEBUG','INFO','WARN','ERROR','FATAL') },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'logs',
    timestamps: false,
    indexes: [
      { fields: ['ip'], name: 'idx_logs_ip' }
    ]
  });

  return Log;
};
