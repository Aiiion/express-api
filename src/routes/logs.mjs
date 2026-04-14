import { Router } from "express";
import { index } from "../controllers/v1/logs.controller.mjs";
import { hasJwtSecret, authenticate } from "../middleware/validation.middleware.mjs";

const router = Router();

router.get("/v1/logs", authenticate, index);

export default router;
