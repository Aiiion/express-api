import { contact, cv, ipLocation, test } from '../controllers/info.controller.mjs';
import { hasWeatherApiKey } from '../middleware/validation.middleware.mjs';
import { Router } from "express";

const router = Router();

router.get("/", contact);
router.get("/cv", cv);
router.get("/test", test);
router.get("/ip-location", hasWeatherApiKey, ipLocation);

export default router;