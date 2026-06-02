import { contact, cv, ipLocation, test } from '../controllers/info.controller.mjs';
import { hasWeatherApiKey } from '../middleware/validation.middleware.mjs';
import { Router } from "express";
import cors from 'cors';

const router = Router();

const openCors = cors({ origin: '*' });

router.get("/", openCors, contact);
router.get("/cv", openCors, cv);
router.get("/test", openCors, test);
router.get("/ip-location", openCors, hasWeatherApiKey, ipLocation);

export default router;