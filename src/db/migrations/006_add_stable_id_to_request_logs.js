/**
 * Sequelize/Umzug migration: add stable_id (NOT NULL, UNIQUE) to request_logs for idempotent flush
 */
import { Sequelize } from 'sequelize';

export async function up({ context: queryInterface }) {
  // Add the column as nullable first so existing rows don't violate NOT NULL
  await queryInterface.addColumn('request_logs', 'stable_id', {
    type: Sequelize.UUID,
    allowNull: true,
    unique: true,
  });

  // Backfill any existing rows with a generated UUID
  await queryInterface.sequelize.query(
    'UPDATE request_logs SET stable_id = gen_random_uuid() WHERE stable_id IS NULL'
  );

  // Verify no NULLs remain before tightening the constraint
  const [[{ count }]] = await queryInterface.sequelize.query(
    'SELECT COUNT(*)::int AS count FROM request_logs WHERE stable_id IS NULL'
  );
  if (count > 0) {
    throw new Error(`Migration 006: ${count} row(s) still have NULL stable_id after backfill`);
  }

  // Enforce NOT NULL (UNIQUE index already set by addColumn above)
  await queryInterface.sequelize.query(
    'ALTER TABLE request_logs ALTER COLUMN stable_id SET NOT NULL'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn('request_logs', 'stable_id');
}
