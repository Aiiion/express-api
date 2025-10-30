import { contact, test, pollution, weather } from '../controllers/api.controller.mjs';
import { Router } from "express";
import { cache, requireLatLon } from '../middleware/cache.mjs';

const router = Router();

router.get("/", contact);
router.get("/test", test);
router.get("/weather", [requireLatLon, cache(60 * 10)], weather);
router.get("/pollution", [requireLatLon, cache(60 * 10)], pollution);

export default router;
