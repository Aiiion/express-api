import { initiateLogin, verifyCode, verifyToken, logout } from '../controllers/v1/auth.controller.mjs';
import { Router } from "express";
import { checkSchema } from 'express-validator';
import { validateResult, hasJwtSecret, hasAdminPassword, authenticate } from '../middleware/validation.middleware.mjs';
import { verifyCodeValidationSchema, loginValidationSchema } from '../utils/validationSchemas.mjs';

const router = Router();

router.post("/v1/auth/login", hasAdminPassword, checkSchema(loginValidationSchema), validateResult, initiateLogin);
router.post("/v1/auth/verify", checkSchema(verifyCodeValidationSchema), validateResult, hasJwtSecret, verifyCode);
router.get("/v1/auth/verify-token", authenticate, verifyToken);
router.post("/v1/auth/logout", logout);

export default router;
