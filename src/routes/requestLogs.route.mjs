import { Router } from "express";
import { index } from "../controllers/v1/requestLogs.controller.mjs";
import { cache } from '../middleware/cache.middleware.mjs';
import { show as metaShow, index as metaIndex } from "../controllers/v1/requestLogs.meta.controller.mjs";
import { logsIndexValidationSchema } from '../utils/validationSchemas.mjs';
import { checkSchema } from 'express-validator';
import { authenticate, metaFieldExists, validateResult } from "../middleware/validation.middleware.mjs";
import cors from 'cors';
import { createStrictCorsOptionsDelegate } from '../utils/corsHelpers.mjs';

const router = Router();

const logsCorsOptions = createStrictCorsOptionsDelegate({
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});

// Apply CORS to all request logs routes
router.use("/v1/logs", cors(logsCorsOptions));

router.get("/v1/logs", authenticate, checkSchema(logsIndexValidationSchema), validateResult, index);
router.get("/v1/logs/meta", authenticate, cache(60 * 15), metaIndex);
router.get("/v1/logs/meta/:field", authenticate, metaFieldExists, cache(60 * 5), metaShow);

export default router;
