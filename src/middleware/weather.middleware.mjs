export const requireLatLon = (req, res, next) => {
    if(!req.query.lat || !req.query.lon)
        return res.status(400).send({message: "You need to provide both lat and lon coordinates"});
    next();
} 
export const hasOwmKey = (req, res, next) => {
    if (!process.env.WEATHER_API_KEY)
        return res
          .status(500)
          .send({ message: "API key missing from environment variables" });
    next();
} 
