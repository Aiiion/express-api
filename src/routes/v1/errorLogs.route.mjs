import { Router } from "express";
import { index } from "../../controllers/v1/errorLogs.controller.mjs";
import { cache } from '../../middleware/cache.middleware.mjs';
import { show as metaShow, index as metaIndex } from "../../controllers/v1/errorLogs.meta.controller.mjs";
import { logsIndexValidationSchema } from '../../utils/validationSchemas.mjs';
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

router.get("/v1/errorLogs", authenticate, checkSchema(logsIndexValidationSchema), validateResult, index);
router.get("/v1/errorLogs/meta", authenticate, cache(60 * 15), metaIndex);
router.get("/v1/errorLogs/meta/:field", authenticate, metaFieldExists, cache(60 * 5), metaShow);

export default router;
