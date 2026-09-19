import { Router } from 'express';
import { registerResource } from './routeManifest.mjs';

registerResource({ name: 'Location', endpoint: '/v1/locations', meta: '/v1/locations/meta' });

import cors from 'cors';
import { checkSchema } from 'express-validator';
import { destroy, index, show, store, update } from '../../controllers/v1/locations.controller.mjs';
import { index as metaIndex, show as metaShow } from '../../controllers/v1/locations.meta.controller.mjs';
import { cache } from '../../middleware/cache.middleware.mjs';
import { createRateLimiter } from '../../middleware/rateLimit.middleware.mjs';
import { authenticate, metaFieldExists, validateResult } from '../../middleware/validation.middleware.mjs';
import { createStrictCorsOptionsDelegate } from '../../utils/corsHelpers.mjs';
import {
  idParamValidationSchema,
  locationStoreValidationSchema,
  locationsIndexValidationSchema,
  locationUpdateValidationSchema,
} from '../../utils/validationSchemas.mjs';

const router = Router();

// Read and create are public, so they get the open CORS the weather endpoint
// uses. Meta, update and delete are cookie-authenticated, and browsers refuse
// to send credentials against `Access-Control-Allow-Origin: *`, so those go
// through the allowlist delegate instead. One delegate picks per request:
// stacking two cors() mounts would just overwrite each other's headers.
const strictCorsOptions = createStrictCorsOptionsDelegate({
  methods: ['GET', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
const openCorsOptions = { origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] };
const ADMIN_METHODS = new Set(['PATCH', 'DELETE']);

const locationsCorsOptions = (req, callback) => {
  const path = req.originalUrl.split('?')[0];
  // A preflight's own method is OPTIONS; the one being asked about is in the header.
  const method = req.method === 'OPTIONS' ? req.header('Access-Control-Request-Method') : req.method;
  const isAdminRoute = path.startsWith('/v1/locations/meta') || ADMIN_METHODS.has(method);

  return isAdminRoute ? strictCorsOptions(req, callback) : callback(null, openCorsOptions);
};

router.use('/v1/locations', cors(locationsCorsOptions));

const storeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  prefix: 'rl:locations:',
  message: { code: 429, message: 'Too many locations created, please try again later' },
});

router.get('/v1/locations', checkSchema(locationsIndexValidationSchema), validateResult, index);
router.post('/v1/locations', storeLimiter, checkSchema(locationStoreValidationSchema), validateResult, store);

// Meta before `/:id`, or the param route swallows "meta"
router.get('/v1/locations/meta', authenticate, cache(60 * 15), metaIndex);
router.get('/v1/locations/meta/:field', authenticate, metaFieldExists, cache(60 * 5), metaShow);

router.get('/v1/locations/:id', checkSchema(idParamValidationSchema), validateResult, show);
router.patch(
  '/v1/locations/:id',
  authenticate,
  checkSchema({ ...idParamValidationSchema, ...locationUpdateValidationSchema }),
  validateResult,
  update,
);
router.delete('/v1/locations/:id', authenticate, checkSchema(idParamValidationSchema), validateResult, destroy);

export default router;
