import { index as v1WeatherIndex } from '../../controllers/v1/weather.controller.mjs';
import { registerAggregate } from './routeManifest.mjs';

registerAggregate({ name: 'Weather', description: 'Aggregated weather data from multiple external sources', endpoint: '/v1/weather' });
import { Router } from "express";
import { cache } from '../../middleware/cache.middleware.mjs';
import { weatherValidationSchema } from '../../utils/validationSchemas.mjs';
import { checkSchema } from 'express-validator';
import { hasOwmKey, validateResult } from '../../middleware/validation.middleware.mjs';
import cors from 'cors';

const router = Router();

router.use('/v1/weather', cors({ origin: '*' }));

// Key on the sanitized params (coordinates rounded to 3 decimals, defaults
// applied, fixed param order) rather than the raw URL, so equivalent requests
// share one cache entry regardless of param order or GPS-precision noise.
const weatherCacheKey = (req) => {
    const { lat, lon, days, units } = req.query;
    return `/v1/weather?lat=${lat}&lon=${lon}&days=${days}&units=${units ? 'metric' : 'imperial'}`;
};

const weatherMiddleware = [
    checkSchema(weatherValidationSchema),
    validateResult,
    hasOwmKey,
    cache(60 * 10, weatherCacheKey)
];

// V1 routes - uses weatherAggregator service for multi-source data
router.get("/v1/weather", weatherMiddleware, v1WeatherIndex);


export default router;
