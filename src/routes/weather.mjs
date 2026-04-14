import { pollution, weather } from '../controllers/weather.controller.mjs';
import { index as v1WeatherIndex } from '../controllers/v1/weather.controller.mjs';
import { Router } from "express";
import { cache } from '../middleware/cache.middleware.mjs';
import { latLonValidationSchema } from '../utils/validationSchemas.mjs';
import { checkSchema } from 'express-validator';
import { hasOwmKey, validateResult } from '../middleware/validation.middleware.mjs';

const router = Router();
const weatherMiddleware = [
    checkSchema(latLonValidationSchema),
    validateResult,
    hasOwmKey,
    cache(60 * 10)
];

router.get("/weather", weatherMiddleware, weather);
router.get("/weather/pollution", weatherMiddleware, pollution);

// V1 routes - uses weatherAggregator service for multi-source data
router.get("/v1/weather", weatherMiddleware, v1WeatherIndex);


export default router;
