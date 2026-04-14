import { validationResult } from "express-validator";

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
    if (!process.env.JWT_SECRET)
        return res
          .status(500)
          .send({ 
            code: 500,
            message: "JWT not configured" 
        });
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
