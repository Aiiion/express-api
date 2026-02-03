# Queue Worker - Hello World

This project includes a queue worker system using Bull (Redis-based queue).

## Prerequisites

- Redis server running on `localhost:6379` (or configure via environment variables)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure Redis is running:
```bash
# On Linux with Docker
docker run -d -p 6379:6379 redis

# Or install Redis locally
sudo apt-get install redis-server
sudo systemctl start redis
```

3. Configure Redis connection (optional):
Create/update `.env` file:
```
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Running the Worker

Start the queue worker:
```bash
npm run worker
```

For development with auto-reload:
```bash
npm run worker:dev
```

## Using the Queue

### Add a Hello World job to the queue

```bash
curl -X POST http://localhost:3000/queue/hello
```

Response:
```json
{
  "success": true,
  "message": "Hello world job added to queue",
  "jobId": 1
}
```

### Check queue statistics

```bash
curl http://localhost:3000/queue/stats
```

Response:
```json
{
  "success": true,
  "stats": {
    "waiting": 0,
    "active": 0,
    "completed": 5,
    "failed": 0
  }
}
```

## How It Works

1. **Queue Configuration** ([src/queues/helloQueue.mjs](src/queues/helloQueue.mjs)): Defines the Bull queue
2. **Worker** ([src/workers/helloWorker.mjs](src/workers/helloWorker.mjs)): Processes jobs and logs "Hello World"
3. **Controller** ([src/controllers/queue.controller.mjs](src/controllers/queue.controller.mjs)): API endpoints to interact with the queue
4. **Routes** ([src/routes/queue.mjs](src/routes/queue.mjs)): Exposes queue endpoints

## Running Both API and Worker

In separate terminal windows:

Terminal 1 - API Server:
```bash
npm start
```

Terminal 2 - Queue Worker:
```bash
npm run worker
```

Then trigger jobs via the API and watch the worker console output.
