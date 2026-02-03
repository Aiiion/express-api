import dotenv from 'dotenv';
dotenv.config();

// Import the worker to start processing jobs
import '../workers/helloWorker.mjs';

// Keep the process running
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing worker gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing worker gracefully');
  process.exit(0);
});
