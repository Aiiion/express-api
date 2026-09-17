import cors from 'cors';
import { Router } from 'express';
import { index } from '../../controllers/v1/index.controller.mjs';
import { createStrictCorsOptionsDelegate } from '../../utils/corsHelpers.mjs';

const router = Router();

const indexCorsOptions = createStrictCorsOptionsDelegate({
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
});

router.get('/v1', cors(indexCorsOptions), index);

export default router;
