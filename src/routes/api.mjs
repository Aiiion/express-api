import { contact, test } from '../controllers/info.controller.mjs';
import { aggregate, pollution, weather } from '../controllers/weather.controller.mjs';
import { Router } from "express";
import { cache } from '../middleware/cache.middleware.mjs';
import { requireLatLon } from '../middleware/weather.middleware.mjs';

const router = Router();

router.get("/", contact);
router.get("/test", test);
router.get("/weather", [requireLatLon, cache(60 * 10)], weather);
router.get("/weather/pollution", [requireLatLon, cache(60 * 10)], pollution);
router.get("/weather/aggregate", [requireLatLon, cache(60 * 10)], aggregate);


export default router;
