import cors from 'cors';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { checkSchema } from 'express-validator';
import { RedisStore } from 'rate-limit-redis';
import { initiateLogin, logout, verifyCode, verifyToken } from '../../controllers/v1/auth.controller.mjs';
import {
  authenticate,
  hasAdminPassword,
  hasJwtSecret,
  validateResult,
} from '../../middleware/validation.middleware.mjs';
import { sendRedisCommand } from '../../services/infrastructure/redis.service.mjs';
import { createStrictCorsOptionsDelegate } from '../../utils/corsHelpers.mjs';
import { loginValidationSchema, verifyCodeValidationSchema } from '../../utils/validationSchemas.mjs';

const router = Router();

const authCorsOptions = createStrictCorsOptionsDelegate({
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
});

const loginLimiterOptions = {
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: 'Too many login attempts, please try again later' },
};

if (process.env.NODE_ENV !== 'test') {
  loginLimiterOptions.store = new RedisStore({ sendCommand: sendRedisCommand });
}

const loginLimiter = rateLimit(loginLimiterOptions);

// Apply CORS to all auth routes
router.use('/v1/auth', cors(authCorsOptions));

router.post(
  '/v1/auth/login',
  loginLimiter,
  hasAdminPassword,
  checkSchema(loginValidationSchema),
  validateResult,
  initiateLogin,
);
router.post('/v1/auth/verify', checkSchema(verifyCodeValidationSchema), validateResult, hasJwtSecret, verifyCode);
router.get('/v1/auth/verify-token', authenticate, verifyToken);
router.post('/v1/auth/logout', logout);

export default router;
