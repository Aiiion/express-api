import { Router } from 'express';
import { index } from '../../controllers/v1/index.controller.mjs';

const router = Router();

router.get('/v1', index);

export default router;
