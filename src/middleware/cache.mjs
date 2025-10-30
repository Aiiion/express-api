import mcache from 'memory-cache';

export const cache = (duration) => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url
    let cachedBody = mcache.get(key)
    if (cachedBody) {
      res.send(JSON.parse(cachedBody))
      return
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        //time arg is in ms
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body)
      }
      next()
    }
  }
}

export const requireLatLon = (req, res, next) => {
    if(!req.query.lat || !req.query.lon)
        return res.status(400).send({message: "You need to provide both lat and lon coordinates"});
    next();
} 