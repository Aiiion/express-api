import Queue from 'bull';

// Create a queue for hello world jobs
const helloQueue = new Queue('hello-world', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
});

export default helloQueue;
