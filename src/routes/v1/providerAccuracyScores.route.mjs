import { Router } from 'express';
import { index } from '../../controllers/v1/providerAccuracyScores.controller.mjs';
import { cache } from '../../middleware/cache.middleware.mjs';
import { show as metaShow, index as metaIndex } from '../../controllers/v1/providerAccuracyScores.meta.controller.mjs';
import { providerAccuracyScoresIndexValidationSchema } from '../../utils/validationSchemas.mjs';
import { checkSchema } from 'express-validator';
import { authenticate, metaFieldExists, validateResult } from '../../middleware/validation.middleware.mjs';
import cors from 'cors';
import { createStrictCorsOptionsDelegate } from '../../utils/corsHelpers.mjs';

const router = Router();

const corsOptions = createStrictCorsOptionsDelegate({
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

router.use('/v1/providerAccuracyScores', cors(corsOptions));

router.get('/v1/providerAccuracyScores', authenticate, checkSchema(providerAccuracyScoresIndexValidationSchema), validateResult, index);
router.get('/v1/providerAccuracyScores/meta', authenticate, cache(60 * 15), metaIndex);
router.get('/v1/providerAccuracyScores/meta/:field', authenticate, metaFieldExists, cache(60 * 5), metaShow);

export default router;
