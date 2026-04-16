import { initiateLogin, verifyCode, verifyToken, logout } from '../controllers/v1/auth.controller.mjs';
import { Router } from "express";
import { checkSchema } from 'express-validator';
import { validateResult, hasJwtSecret, hasAdminPassword, authenticate } from '../middleware/validation.middleware.mjs';
import { verifyCodeValidationSchema, loginValidationSchema } from '../utils/validationSchemas.mjs';
import cors from 'cors';
import { createStrictCorsOptionsDelegate } from '../utils/corsHelpers.mjs';

const router = Router();

const authCorsOptions = createStrictCorsOptionsDelegate({
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
});

// Apply CORS to all auth routes
router.use("/v1/auth", cors(authCorsOptions));

router.post("/v1/auth/login", hasAdminPassword, checkSchema(loginValidationSchema), validateResult, initiateLogin);
router.post("/v1/auth/verify", checkSchema(verifyCodeValidationSchema), validateResult, hasJwtSecret, verifyCode);
router.get("/v1/auth/verify-token", authenticate, verifyToken);
router.post("/v1/auth/logout", logout);

export default router;
