import { test, weather } from '../controllers/api.controller.mjs';
import { Router } from "express";
import { cache } from '../middleware/cache.mjs';

const router = Router();

router.get("/", test);

router.post("/weather", cache(60 * 10), weather);

export default router;
