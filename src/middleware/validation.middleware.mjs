import { validationResult } from "express-validator";

export const validateResult = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
} 

export const hasOwmKey = (req, res, next) => {
    if (!process.env.WEATHER_API_KEY)
        return res
          .status(500)
          .send({ message: "API key missing from environment variables" });
    next();
}

export const hasWeatherApiKey = (req, res, next) => {
    if (!process.env.WEATHERAPI_API_KEY)
        return res
          .status(500)
          .send({ message: "API key missing from environment variables" });
    next();
}
