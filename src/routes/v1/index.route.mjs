import { Router } from 'express';
import cors from 'cors';
import { index } from '../../controllers/v1/index.controller.mjs';

const router = Router();

router.use('/v1', cors({ origin: '*' }));
router.get('/v1', index);

export default router;
