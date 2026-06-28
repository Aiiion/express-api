import { Router } from "express";
import { registerResource } from './routeManifest.mjs';

registerResource({ name: 'ErrorLog', endpoint: '/v1/errorLogs', meta: '/v1/errorLogs/meta' });
import { index } from "../../controllers/v1/errorLogs.controller.mjs";
import { cache } from '../../middleware/cache.middleware.mjs';
import { show as metaShow, index as metaIndex } from "../../controllers/v1/errorLogs.meta.controller.mjs";
import { errorLogsIndexValidationSchema } from '../../utils/validationSchemas.mjs';
import { checkSchema } from 'express-validator';
import { authenticate, metaFieldExists, validateResult } from "../../middleware/validation.middleware.mjs";
import cors from 'cors';
import { createStrictCorsOptionsDelegate } from '../../utils/corsHelpers.mjs';

const router = Router();

const errorLogsCorsOptions = createStrictCorsOptionsDelegate({
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

// Apply CORS to all error logs routes
router.use("/v1/errorLogs", cors(errorLogsCorsOptions));

router.get("/v1/errorLogs", authenticate, checkSchema(errorLogsIndexValidationSchema), validateResult, index);
router.get("/v1/errorLogs/meta", authenticate, cache(60 * 15), metaIndex);
router.get("/v1/errorLogs/meta/:field", authenticate, metaFieldExists, cache(60 * 5), metaShow);

export default router;
