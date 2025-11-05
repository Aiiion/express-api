import { contact, test } from '../controllers/info.controller.mjs';
import { Router } from "express";

const router = Router();

router.get("/", contact);
router.get("/test", test);

export default router;