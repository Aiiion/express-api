import { Router } from 'express';
import { addHelloJob, getQueueStats } from '../controllers/queue.controller.mjs';

const router = Router();

// Add a hello world job to the queue
router.post('/hello', addHelloJob);

// Get queue statistics
router.get('/stats', getQueueStats);

export default router;
