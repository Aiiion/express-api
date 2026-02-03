import helloQueue from '../queues/helloQueue.mjs';

/**
 * Add a hello world job to the queue
 */
export const addHelloJob = async (req, res) => {
  try {
    const job = await helloQueue.add({
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'Hello world job added to queue',
      jobId: job.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add job to queue',
      error: error.message,
    });
  }
};

/**
 * Get queue stats
 */
export const getQueueStats = async (req, res) => {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      helloQueue.getWaitingCount(),
      helloQueue.getActiveCount(),
      helloQueue.getCompletedCount(),
      helloQueue.getFailedCount(),
    ]);

    res.json({
      success: true,
      stats: {
        waiting,
        active,
        completed,
        failed,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get queue stats',
      error: error.message,
    });
  }
};
