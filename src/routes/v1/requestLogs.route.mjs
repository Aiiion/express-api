import { Router } from 'express';
import { registerResource } from './routeManifest.mjs';

registerResource({ name: 'RequestLog', endpoint: '/v1/requestLogs', meta: '/v1/requestLogs/meta' });

import cors from 'cors';
import { checkSchema } from 'express-validator';
import { index } from '../../controllers/v1/requestLogs.controller.mjs';
import { index as metaIndex, show as metaShow } from '../../controllers/v1/requestLogs.meta.controller.mjs';
import { cache } from '../../middleware/cache.middleware.mjs';
import { authenticate, metaFieldExists, validateResult } from '../../middleware/validation.middleware.mjs';
import { createStrictCorsOptionsDelegate } from '../../utils/corsHelpers.mjs';
import { requestLogsIndexValidationSchema } from '../../utils/validationSchemas.mjs';

const router = Router();

const logsCorsOptions = createStrictCorsOptionsDelegate({
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Apply CORS to all request logs routes
router.use('/v1/requestLogs', cors(logsCorsOptions));

router.get('/v1/requestLogs', authenticate, checkSchema(requestLogsIndexValidationSchema), validateResult, index);
router.get('/v1/requestLogs/meta', authenticate, cache(60 * 15), metaIndex);
router.get('/v1/requestLogs/meta/:field', authenticate, metaFieldExists, cache(60 * 5), metaShow);

export default router;
