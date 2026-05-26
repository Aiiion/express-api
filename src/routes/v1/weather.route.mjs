import { index as v1WeatherIndex } from '../../controllers/v1/weather.controller.mjs';
import { Router } from "express";
import { cache } from '../../middleware/cache.middleware.mjs';
import { latLonValidationSchema } from '../../utils/validationSchemas.mjs';
import { checkSchema } from 'express-validator';
import { hasOwmKey, validateResult } from '../../middleware/validation.middleware.mjs';
import cors from 'cors';

const router = Router();

router.use('/v1/weather', cors({ origin: '*' }));

const weatherMiddleware = [
    checkSchema(latLonValidationSchema),
    validateResult,
    hasOwmKey,
    cache(60 * 10)
];

// V1 routes - uses weatherAggregator service for multi-source data
router.get("/v1/weather", weatherMiddleware, v1WeatherIndex);


export default router;
