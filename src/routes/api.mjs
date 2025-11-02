import { contact, test } from '../controllers/info.controller.mjs';
import { aggregate, pollution, weather } from '../controllers/weather.controller.mjs';
import { Router } from "express";
import { cache } from '../middleware/cache.middleware.mjs';
import { requireLatLon, hasOwmKey } from '../middleware/weather.middleware.mjs';

const router = Router();
const weatherMiddleware = [
    requireLatLon,
    hasOwmKey
];

router.get("/", contact);
router.get("/test", test);
router.get("/weather", [...weatherMiddleware, cache(60 * 10)], weather);
router.get("/weather/pollution", [...weatherMiddleware, cache(60 * 10)], pollution);
router.get("/weather/aggregate", [...weatherMiddleware, cache(60 * 10)], aggregate);


export default router;
