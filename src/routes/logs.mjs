import { Router } from "express";
import { index } from "../controllers/v1/logs.controller.mjs";
import { show as metaShow, index as metaIndex } from "../controllers/v1/logs.meta.controller.mjs";
import { authenticate } from "../middleware/validation.middleware.mjs";
import cors from 'cors';

const router = Router();

// CORS configuration for logs routes with credentials support
const logsCorsOptions = {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply CORS to all logs routes
router.use("/v1/logs", cors(logsCorsOptions));

router.get("/v1/logs", authenticate, index);
router.get("/v1/logs/meta", authenticate, metaIndex);
router.get("/v1/logs/meta/:field", authenticate, metaShow);

export default router;
