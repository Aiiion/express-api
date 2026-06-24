import { Sequelize } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('provider_accuracy_scores', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    provider: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    // 2-letter ISO code; 'GL' is the sentinel for global (coordinates outside SE/NO/FI)
    country_code: {
      type: Sequelize.CHAR(2),
      allowNull: false,
      defaultValue: 'GL',
    },
    temp_mae: { type: Sequelize.REAL, allowNull: true },
    precip_mae: { type: Sequelize.REAL, allowNull: true },
    wind_mae: { type: Sequelize.REAL, allowNull: true },
    humidity_mae: { type: Sequelize.REAL, allowNull: true },
    sample_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    computed_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
  });

  await queryInterface.addConstraint('provider_accuracy_scores', {
    fields: ['provider', 'country_code'],
    type: 'unique',
    name: 'uq_pas_provider_country',
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('provider_accuracy_scores');
}
