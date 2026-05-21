import { validationResult } from "express-validator";
import jwt from 'jsonwebtoken';
import { getMetaResourceModel } from '../utils/bindingsHelpers.mjs';
import { COOKIE_NAME } from '../utils/constants.mjs';

const jwtSecretCheck = (res) => {
    if (!process.env.JWT_SECRET) {
        res.status(500).send({ 
            code: 500,
            message: "JWT not configured" 
        });
        return true;
    }
    return false;
}

const requireEnv = (varName, message) => (req, res, next) => {
    if (!process.env[varName])
        return res.status(500).json({ code: 500, message });
    next();
};

export const hasOwmKey = requireEnv('OWM_API_KEY', 'API key missing from environment variables');
export const hasWeatherApiKey = requireEnv('WEATHERAPI_API_KEY', 'API key missing from environment variables');
export const hasAdminPassword = requireEnv('ADMIN_PASSWORD', 'Authentication not configured');

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

export const metaFieldExists = (req, res, next) => {
    const model = getMetaResourceModel(req);
    const field = req.params.field;

    if (!model) {
        return res.status(404).json({
            code: 404,
            message: 'Resource not found'
        });
    }

    const validFields = Object.keys(model.getAttributes());

    if (!validFields.includes(field)) {
        return res.status(404).json({
            code: 404,
            message: 'Field not found for the requested resource'
        });
    }

    next();
};

export const hasJwtSecret = (req, res, next) => {
    if (jwtSecretCheck(res)) return;
    next();
}

export const authenticate = (req, res, next) => {
    if (jwtSecretCheck(res)) return;
    try {
        const token = req.cookies[COOKIE_NAME];
        if (!token) {
            return res.status(401).json({
                code: 401,
                message: 'Authentication required'
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
