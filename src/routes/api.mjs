import { contact, test, pollution, weather } from '../controllers/api.controller.mjs';
import { Router } from "express";
import { cache } from '../middleware/cache.mjs';

const router = Router();

router.get("/", contact);
router.get("/test", test);
router.post("/weather", cache(60 * 10), weather);
router.post("/pollution", cache(60 * 10), pollution);

export default router;
