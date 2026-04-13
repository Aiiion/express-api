import { initiateLogin, verifyCode, verifyToken } from '../controllers/auth.controller.mjs';
import { Router } from "express";
import { checkSchema } from 'express-validator';
import { validateResult, hasJwtSecret, hasAdminPassword } from '../middleware/validation.middleware.mjs';
import { bearerTokenValidationSchema, verifyCodeValidationSchema, loginValidationSchema } from '../utils/validationSchemas.mjs';

const router = Router();

router.post("/auth/login", hasAdminPassword, checkSchema(loginValidationSchema), validateResult, initiateLogin);
router.post("/auth/verify", checkSchema(verifyCodeValidationSchema), validateResult, hasJwtSecret, verifyCode);
router.get("/auth/verify-token", checkSchema(bearerTokenValidationSchema), validateResult, hasJwtSecret, verifyToken);

export default router;
