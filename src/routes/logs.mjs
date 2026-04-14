import { Router } from "express";
import { index } from "../controllers/v1/logs.controller.mjs";
import { hasJwtSecret, authenticate } from "../middleware/validation.middleware.mjs";
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

export default router;
