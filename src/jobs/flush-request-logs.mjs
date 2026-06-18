import { sequelize } from '../models/index.mjs';
import {
  acquireRequestLogsFlushLock,
  clearProcessingRequestLogs,
  getProcessingRequestLogs,
  getRequestLogProcessingLength,
  getRequestLogQueueLength,
  moveAndFetchRequestLogs,
  peekOldestRequestLog,
  releaseRequestLogsFlushLock,
} from '../services/redis.service.mjs';

export const REQUEST_LOG_BATCH_SIZE = 500;
// Logs older than this threshold are flushed even when the queue has fewer
// entries than batchSize, preventing indefinite accumulation of partial batches.
export const PARTIAL_FLUSH_AGE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes
const REQUEST_LOG_LOCK_TTL_SECONDS = 130;

const parseRequestLogEntry = (entry) => {
  const parsedEntry = JSON.parse(entry);

  return {
    ...parsedEntry,
    created_at: parsedEntry.created_at ? new Date(parsedEntry.created_at) : new Date(),
  };
};

export const flushRequestLogs = async (batchSize = REQUEST_LOG_BATCH_SIZE) => {
  const lockToken = await acquireRequestLogsFlushLock(REQUEST_LOG_LOCK_TTL_SECONDS);
  if (!lockToken) {
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
      const processingLength = await getRequestLogProcessingLength();

      let rawBatch;
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

        // Atomically move items to the processing list and return them in one
        // round-trip, avoiding a separate getProcessingRequestLogs call.
        rawBatch = await moveAndFetchRequestLogs(Math.min(batchSize, queueLength));
        if (rawBatch.length === 0) break;
      } else {
        // Crash-recovery path: items left in processing from a previous failed run.
        rawBatch = await getProcessingRequestLogs();
        if (rawBatch.length === 0) {
          await clearProcessingRequestLogs();
          break;
        }
      }

      const batch = rawBatch.map(parseRequestLogEntry);

      await RequestLog.bulkCreate(batch, { validate: true, ignoreDuplicates: true });
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
    await releaseRequestLogsFlushLock(lockToken);
  }
};
