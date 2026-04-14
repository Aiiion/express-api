import mcache from 'memory-cache';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../services/email.service.mjs';

const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const JWT_EXPIRY = '3h';

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

        // Store code in cache with session token as key (10 minutes)
        mcache.put(`auth_session_${sessionToken}`, {
            code: verificationCode,
            createdAt: Date.now()
        }, SESSION_DURATION_MS);

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
        console.error('initiateLogin error:', error.message);
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
export const verifyCode = (req, res) => {
    try {
        const { sessionToken, code } = req.body;

        // Retrieve session data from cache
        const sessionData = mcache.get(`auth_session_${sessionToken}`);

        if (!sessionData) {
            return res.status(401).send({
                code: 401,
                message: 'Invalid or expired session token'
            });
        }

        // Verify the code
        if (sessionData.code !== code) {
            return res.status(401).send({
                code: 401,
                message: 'Invalid verification code'
            });
        }

        // Clear the session from cache (one-time use)
        mcache.del(`auth_session_${sessionToken}`);

        // Generate JWT token
        const token = jwt.sign(
            {
                authenticated: true,
                issuedAt: Date.now()
            },
            process.env.JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        return res.status(200).send({
            message: 'Authentication successful',
            token,
            expiresIn: JWT_EXPIRY
        });

    } catch (error) {
        console.error('verifyCode error:', error.message)
        return res.status(500).send({
            code: 500,
            message: 'Failed to verify code'
        });
    }
};

/**
 * Verifies JWT token validity
 * GET /auth/verify-token
 * Header: Authorization: Bearer <token>
 */
export const verifyToken = (req, res) => {
    try {
        const token = req.headers.authorization.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET);

        return res.status(200).send({
            message: 'Token is valid'
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).send({
                code: 401,
                message: 'Token has expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).send({
                code: 401,
                message: 'Invalid token'
            });
        }
        console.error('verifyToken error:', error.message);
        return res.status(500).send({
            code: 500,
            message: 'Failed to verify token'
        });
    }
};
