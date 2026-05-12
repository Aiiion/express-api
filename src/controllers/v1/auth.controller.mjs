import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../services/email.service.mjs';
import { deleteValue, getJsonValue, setJsonValue } from '../../services/redis.service.mjs';
import { devError } from '../../utils/logger.mjs';

const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const JWT_EXPIRY = '3h';
const JWT_EXPIRY_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const MAX_FAILED_ATTEMPTS = 5;
const COOKIE_NAME = 'jwt_token';

/**
 * Initiates login by verifying password and sending verification code via email
 * POST /auth/login
 * Body: { password: string }
 */
export const initiateLogin = async (req, res) => {
    try {
        // Verify password
        if (req.body.password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).send({
                code: 401,
                message: 'Invalid password'
            });
        }

        // Generate random 6-digit code
        const verificationCode = crypto.randomInt(100000, 999999).toString();

        // Generate session token
        const sessionToken = crypto.randomBytes(32).toString('hex');

        // Store code in Redis with session token as key (10 minutes)
        await setJsonValue(`auth_session_${sessionToken}`, {
            code: verificationCode,
            createdAt: Date.now()
        }, Math.ceil(SESSION_DURATION_MS / 1000));

        // Send email with verification code
        await sendEmail(
            process.env.ADMIN_EMAIL,
            'Your Login Verification Code',
            `<h1>Login Verification</h1>
            <p>Your verification code is: <strong>${verificationCode}</strong></p>
            <p>This code will expire in 10 minutes.</p>`
        );

        return res.status(200).send({
            message: 'Verification code sent to email',
            sessionToken,
            expiresIn: SESSION_DURATION_MS / 1000 // in seconds
        });

    } catch (error) {
        devError('initiateLogin error:', error.message);
        return res.status(500).send({
            code: 500,
            message: 'Failed to initiate login'
        });
    }
};

/**
 * Verifies the session token and code, returns JWT if valid
 * POST /auth/verify
 * Body: { sessionToken: string, code: string }
 */
export const verifyCode = async (req, res) => {
    try {
        const { sessionToken, code } = req.body;

        // Retrieve session data from Redis
        const sessionData = await getJsonValue(`auth_session_${sessionToken}`);

        if (!sessionData) {
            return res.status(401).send({
                code: 401,
                message: 'Invalid or expired session token'
            });
        }

        // Verify the code
        if (sessionData.code !== code) {
            // Track failed attempts
            sessionData.failedAttempts = (sessionData.failedAttempts || 0) + 1;

            if (sessionData.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                // Lock the session
                await deleteValue(`auth_session_${sessionToken}`);
                return res.status(401).send({
                    code: 401,
                    message: 'Session locked due to too many failed attempts'
                });
            }

            // Persist updated session with remaining TTL
            const elapsed = Date.now() - sessionData.createdAt;
            const remainingTTL = Math.max(SESSION_DURATION_MS - elapsed, 0);
            if (remainingTTL <= 0) {
                await deleteValue(`auth_session_${sessionToken}`);
                return res.status(401).send({
                    code: 401,
                    message: 'Invalid or expired session token'
                });
            }
            await setJsonValue(
                `auth_session_${sessionToken}`,
                sessionData,
                Math.ceil(remainingTTL / 1000),
            );

            return res.status(401).send({
                code: 401,
                message: 'Invalid verification code'
            });
        }

        // Clear the session from Redis (one-time use)
        await deleteValue(`auth_session_${sessionToken}`);

        // Generate JWT token
        const token = jwt.sign(
            {
                authenticated: true,
                issuedAt: Date.now()
            },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        // Set JWT as HTTP-only cookie
        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: JWT_EXPIRY_MS
        });

        return res.status(200).send({
            message: 'Authentication successful',
            expiresIn: JWT_EXPIRY
        });

    } catch (error) {
        devError('verifyCode error:', error.message)
        return res.status(500).send({
            code: 500,
            message: 'Failed to verify code'
        });
    }
};

/**
 * Verifies JWT token validity
 * GET /auth/verify-token
 * Cookie: jwt_token=<token>
 * Note: Validation is handled by authenticate middleware
 */
export const verifyToken = (req, res) => {
    return res.status(200).send({
        message: 'Token is valid'
    });
};

/**
 * Logs out user by clearing the JWT cookie
 * POST /auth/logout
 */
export const logout = (req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    return res.status(200).send({
        message: 'Logged out successfully'
    });
};
