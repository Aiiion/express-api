import { Router } from 'express';
import cors from 'cors';
import { createStrictCorsOptionsDelegate } from '../../utils/corsHelpers.mjs';
import { index } from '../../controllers/v1/index.controller.mjs';

const router = Router();

const indexCorsOptions = createStrictCorsOptionsDelegate({
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
});

router.get('/v1', cors(indexCorsOptions), index);

export default router;
