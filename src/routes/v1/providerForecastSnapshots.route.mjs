import { Router } from 'express';
import { index } from '../../controllers/v1/providerForecastSnapshots.controller.mjs';
import { cache } from '../../middleware/cache.middleware.mjs';
import { show as metaShow, index as metaIndex } from '../../controllers/v1/providerForecastSnapshots.meta.controller.mjs';
import { providerForecastSnapshotsIndexValidationSchema } from '../../utils/validationSchemas.mjs';
import { checkSchema } from 'express-validator';
import { authenticate, metaFieldExists, validateResult } from '../../middleware/validation.middleware.mjs';
import cors from 'cors';
import { createStrictCorsOptionsDelegate } from '../../utils/corsHelpers.mjs';

const router = Router();

const corsOptions = createStrictCorsOptionsDelegate({
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

router.use('/v1/providerForecastSnapshots', cors(corsOptions));

router.get('/v1/providerForecastSnapshots', authenticate, checkSchema(providerForecastSnapshotsIndexValidationSchema), validateResult, index);
router.get('/v1/providerForecastSnapshots/meta', authenticate, cache(60 * 15), metaIndex);
router.get('/v1/providerForecastSnapshots/meta/:field', authenticate, metaFieldExists, cache(60 * 5), metaShow);

export default router;
