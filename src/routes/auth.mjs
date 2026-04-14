import { initiateLogin, verifyCode, verifyToken } from '../controllers/v1/auth.controller.mjs';
import { Router } from "express";
import { checkSchema } from 'express-validator';
import { validateResult, hasJwtSecret, hasAdminPassword } from '../middleware/validation.middleware.mjs';
import { bearerTokenValidationSchema, verifyCodeValidationSchema, loginValidationSchema } from '../utils/validationSchemas.mjs';

const router = Router();

router.post("/v1/auth/login", hasAdminPassword, checkSchema(loginValidationSchema), validateResult, initiateLogin);
router.post("/v1/auth/verify", checkSchema(verifyCodeValidationSchema), validateResult, hasJwtSecret, verifyCode);
router.get("/v1/auth/verify-token", checkSchema(bearerTokenValidationSchema), validateResult, hasJwtSecret, verifyToken);

export default router;
