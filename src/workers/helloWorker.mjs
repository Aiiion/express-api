import helloQueue from '../queues/helloQueue.mjs';

// Process hello world jobs
helloQueue.process(async (job) => {
  console.log('Hello World');
  console.log(`Job ${job.id} processed at ${new Date().toISOString()}`);
  
  // Return some data to indicate success
  return { message: 'Hello World', processedAt: new Date().toISOString() };
});

// Event listeners for monitoring
helloQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed with result:`, result);
});

helloQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err.message);
});

helloQueue.on('active', (job) => {
  console.log(`Job ${job.id} is now active`);
});

console.log('Hello World worker is running and waiting for jobs...');
