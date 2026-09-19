/**
 * Sequelize/Umzug migration: create locations table for user-saved named coordinates
 */
import { Sequelize } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('locations', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    // DOUBLE rather than DECIMAL: pg returns DECIMAL as strings, and this is a
    // public resource whose coordinates should serialize as JSON numbers.
    lat: {
      type: Sequelize.DOUBLE,
      allowNull: false,
    },
    lon: {
      type: Sequelize.DOUBLE,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  });

  // Functional index so uniqueness is case-insensitive ("Stockholm" and
  // "stockholm" collide). A plain UNIQUE on the column would not do that.
  await queryInterface.sequelize.query('CREATE UNIQUE INDEX uq_locations_name_lower ON locations (lower(name))');
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('locations');
}
