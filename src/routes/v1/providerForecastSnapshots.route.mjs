import { Router } from 'express';
import { registerResource } from './routeManifest.mjs';

registerResource({
  name: 'ProviderForecastSnapshots',
  endpoint: '/v1/providerForecastSnapshots',
  meta: '/v1/providerForecastSnapshots/meta',
});

import cors from 'cors';
import { checkSchema } from 'express-validator';
import { index } from '../../controllers/v1/providerForecastSnapshots.controller.mjs';
import {
  index as metaIndex,
  show as metaShow,
} from '../../controllers/v1/providerForecastSnapshots.meta.controller.mjs';
import { cache } from '../../middleware/cache.middleware.mjs';
import { authenticate, metaFieldExists, validateResult } from '../../middleware/validation.middleware.mjs';
import { createStrictCorsOptionsDelegate } from '../../utils/corsHelpers.mjs';
import { providerForecastSnapshotsIndexValidationSchema } from '../../utils/validationSchemas.mjs';

const router = Router();

const corsOptions = createStrictCorsOptionsDelegate({
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

router.use('/v1/providerForecastSnapshots', cors(corsOptions));

router.get(
  '/v1/providerForecastSnapshots',
  authenticate,
  checkSchema(providerForecastSnapshotsIndexValidationSchema),
  validateResult,
  index,
);
router.get('/v1/providerForecastSnapshots/meta', authenticate, cache(60 * 15), metaIndex);
router.get('/v1/providerForecastSnapshots/meta/:field', authenticate, metaFieldExists, cache(60 * 5), metaShow);

export default router;
