import { sequelize } from '../models/index.mjs';
import {
  acquireRequestLogsFlushLock,
  clearProcessingRequestLogs,
  getProcessingRequestLogs,
  getRequestLogProcessingLength,
  getRequestLogQueueLength,
  moveRequestLogsToProcessing,
  peekOldestRequestLog,
  releaseRequestLogsFlushLock,
} from '../services/redis.service.mjs';

export const REQUEST_LOG_BATCH_SIZE = 40;
// Logs older than this threshold are flushed even when the queue has fewer
// entries than batchSize, preventing indefinite accumulation of partial batches.
export const PARTIAL_FLUSH_AGE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const REQUEST_LOG_LOCK_TTL_SECONDS = 110;

const parseRequestLogEntry = (entry) => {
  const parsedEntry = JSON.parse(entry);

  return {
    ...parsedEntry,
    created_at: parsedEntry.created_at ? new Date(parsedEntry.created_at) : new Date(),
  };
};

export const flushRequestLogs = async (batchSize = REQUEST_LOG_BATCH_SIZE) => {
  const lockAcquired = await acquireRequestLogsFlushLock(REQUEST_LOG_LOCK_TTL_SECONDS);
  if (!lockAcquired) {
    return {
      skipped: true,
      batches: 0,
      inserted: 0,
    };
  }

  let batches = 0;
  let inserted = 0;

  try {
    const RequestLog = sequelize.models.RequestLog;
    if (!RequestLog) {
      return {
        skipped: true,
        batches: 0,
        inserted: 0,
      };
    }

    while (true) {
      let processingLength = await getRequestLogProcessingLength();

      if (processingLength === 0) {
        const queueLength = await getRequestLogQueueLength();

        if (queueLength < batchSize) {
          // Always break on empty queue.
          if (queueLength === 0) break;

          // Time-based partial flush: if the oldest queued log has been waiting
          // longer than PARTIAL_FLUSH_AGE_THRESHOLD_MS, flush whatever is
          // available rather than waiting for a full batch.
          const oldest = await peekOldestRequestLog();
          const age = oldest?.created_at
            ? Date.now() - new Date(oldest.created_at).getTime()
            : 0;

          if (age < PARTIAL_FLUSH_AGE_THRESHOLD_MS) break;

          // Oldest log is stale — proceed to flush the partial batch.
        }

        processingLength = await moveRequestLogsToProcessing(Math.min(batchSize, queueLength));
        if (processingLength === 0) break;
      }

      const batch = (await getProcessingRequestLogs()).map(parseRequestLogEntry);
      if (batch.length === 0) {
        await clearProcessingRequestLogs();
        break;
      }

      await RequestLog.bulkCreate(batch, { validate: true });
      await clearProcessingRequestLogs();

      batches += 1;
      inserted += batch.length;
    }

    return {
      skipped: false,
      batches,
      inserted,
    };
  } finally {
    await releaseRequestLogsFlushLock();
  }
};
