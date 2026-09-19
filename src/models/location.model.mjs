import { DataTypes } from 'sequelize';

export default sequelize => {
  const Location = sequelize.define(
    'Location',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      provider_name: { type: DataTypes.STRING(100), allowNull: false },
      lat: { type: DataTypes.DOUBLE, allowNull: false },
      lon: { type: DataTypes.DOUBLE, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'locations',
      timestamps: false,
    },
  );

  return Location;
};
