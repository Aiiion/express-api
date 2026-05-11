import { sequelize } from '../models/index.mjs';
import { devError } from '../utils/logger.mjs';

/**
 * Writes an entry to the error_logs table.
 * Safe to call from anywhere — swallows write failures to avoid cascading errors.
 *
 * @param {Error|string} err
 * @param {{ route?: string, environment?: string }} [context]
 */
export const logError = async (err, context = {}) => {
  try {
    const ErrorLog = sequelize.models.ErrorLog;
    if (!ErrorLog) return;

    const message = err instanceof Error ? err.message : String(err);
    const stack_trace = err instanceof Error ? (err.stack || null) : null;

    await ErrorLog.create({
      message,
      stack_trace,
      route: context.route ?? null,
      environment: context.environment ?? process.env.NODE_ENV ?? null,
    });
  } catch (logErr) {
    devError('Failed to write error log:', logErr);
  }
};
