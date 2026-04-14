import { validationResult } from "express-validator";
import jwt from 'jsonwebtoken';

const jwtSecretCheck = () => {
    if (!process.env.JWT_SECRET)
        return res
          .status(500)
          .send({ 
            code: 500,
            message: "JWT not configured" 
        });
}

export const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        code: 400,
        message: "Validation errors",
        errors: errors.array() 
    });
    }
    next();
} 

export const hasOwmKey = (req, res, next) => {
    if (!process.env.OWM_API_KEY)
        return res
          .status(500)
          .send({ 
            code: 500,
            message: "API key missing from environment variables" 
        });
    next();
}

export const hasWeatherApiKey = (req, res, next) => {
    if (!process.env.WEATHERAPI_API_KEY)
        return res
          .status(500)
          .send({ 
            code: 500,
            message: "API key missing from environment variables" 
        });
    next();
}

export const hasJwtSecret = (req, res, next) => {
    jwtSecretCheck();
    next();
}

export const hasAdminPassword = (req, res, next) => {
    if (!process.env.ADMIN_PASSWORD)
        return res
          .status(500)
          .send({ 
            code: 500,
            message: "Authentication not configured" 
        });
    next();
}

export const authenticate = (req, res, next) => {
    jwtSecretCheck();
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                code: 401,
                message: 'Authorization header must be in format: Bearer <token>'
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                code: 401,
                message: 'Token is required'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                code: 401,
                message: 'Token has expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                code: 401,
                message: 'Invalid token'
            });
        }
        return res.status(500).json({
            code: 500,
            message: 'Failed to verify token'
        });
    }
}
