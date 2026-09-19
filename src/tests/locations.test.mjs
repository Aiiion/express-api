import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import request from 'supertest';
import { sequelize } from '../models/index.mjs';
import { clearRedisTestData, closeRedisConnection } from '../services/infrastructure/redis.service.mjs';

let app;
let server;
let start;
let stop;

// Tests share the dev database, so every row this file creates carries a
// per-run prefix and is removed in afterAll.
const PREFIX = `zz-test-${Date.now()}-`;
const named = suffix => `${PREFIX}${suffix}`;

const stockholm = { lat: 59.3293, lon: 18.0686 };
const ALLOWED_ORIGIN = 'http://allowed.test';
const OTHER_ORIGIN = 'https://evil.example';

describe('Locations Routes', () => {
  const originalEnv = { ...process.env };
  const getAuthCookie = () =>
    `jwt_token=${jwt.sign({ sub: 'test-user' }, process.env.JWT_SECRET, { expiresIn: '3h' })}`;

  // Default provider_name so cases about other fields stay short; pass
  // `provider_name: undefined` to omit it (JSON serialisation drops it).
  const createLocation = body =>
    request(app)
      .post('/v1/locations')
      .send({ provider_name: `${PREFIX}provider`, ...body });

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.OWM_API_KEY = 'test-key';
    process.env.RESEND_API_KEY = 'resend_token_123';
    process.env.CORS_ALLOWLIST = ALLOWED_ORIGIN;

    const mod = await import('../index.mjs');
    app = mod.default;
    start = mod.start;
    stop = mod.stop;
    if (start) {
      server = await start(0);
    }
  });

  beforeEach(async () => {
    await clearRedisTestData();
  });

  afterAll(async () => {
    await sequelize.models.Location.destroy({ where: { name: { [Op.like]: `${PREFIX}%` } } });

    Object.keys(process.env).forEach(key => {
      if (!(key in originalEnv)) delete process.env[key];
    });
    Object.assign(process.env, originalEnv);
    if (stop) await stop();
    else if (server && typeof server.close === 'function') await new Promise(r => server.close(r));
    await closeRedisConnection();
  });

  describe('POST /v1/locations', () => {
    it('creates a location and returns it with numeric, rounded coordinates', async () => {
      const res = await createLocation({ name: `  ${named('Stockholm')}  `, lat: 59.32932, lon: 18.06858 });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        name: named('Stockholm'),
        provider_name: `${PREFIX}provider`,
        lat: 59.329,
        lon: 18.069,
        updated_at: null,
      });
      expect(typeof res.body.data.id).toBe('number');
      expect(typeof res.body.data.lat).toBe('number');
      expect(typeof res.body.data.created_at).toBe('string');
    });

    it('trims provider_name', async () => {
      const res = await createLocation({
        name: named('With provider'),
        provider_name: '  Stockholm, Sweden ',
        ...stockholm,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.provider_name).toBe('Stockholm, Sweden');
    });

    it.each([
      ['missing name', { ...stockholm }],
      ['whitespace-only name', { name: '   ', ...stockholm }],
      ['name over 100 characters', { name: named('x'.repeat(101)), ...stockholm }],
      ['lat out of range', { name: named('bad-lat'), lat: 91, lon: 18 }],
      ['missing lon', { name: named('no-lon'), lat: 59 }],
      ['missing provider_name', { name: named('no-provider'), provider_name: undefined, ...stockholm }],
      ['null provider_name', { name: named('null-provider'), provider_name: null, ...stockholm }],
      ['whitespace-only provider_name', { name: named('blank-provider'), provider_name: '   ', ...stockholm }],
      ['non-string provider_name', { name: named('bad-provider'), provider_name: 42, ...stockholm }],
      [
        'provider_name over 100 characters',
        { name: named('long-provider'), provider_name: 'x'.repeat(101), ...stockholm },
      ],
    ])('returns 400 for %s', async (_label, body) => {
      const res = await createLocation(body);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(400);
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it('returns 409 for a duplicate name, regardless of case', async () => {
      const first = await createLocation({ name: named('Göteborg'), lat: 57.7089, lon: 11.9746 });
      expect(first.status).toBe(201);

      const exact = await createLocation({ name: named('Göteborg'), ...stockholm });
      expect(exact.status).toBe(409);
      expect(exact.body).toEqual({ code: 409, message: 'A location with that name already exists' });

      const otherCase = await createLocation({ name: named('GÖTEBORG'), ...stockholm });
      expect(otherCase.status).toBe(409);
    });
  });

  describe('GET /v1/locations', () => {
    beforeAll(async () => {
      await createLocation({ name: named('Search Malmö'), lat: 55.605, lon: 13.0038 });
      await createLocation({
        name: named('Search Uppsala'),
        provider_name: `${PREFIX}Provider Uppsala kommun`,
        lat: 59.8586,
        lon: 17.6389,
      });
    });

    it('returns a paginated list', async () => {
      const res = await request(app).get('/v1/locations');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toMatchObject({ page: 1, perPage: 25 });
      expect(res.body.pagination.totalCount).toBeGreaterThanOrEqual(2);
    });

    it('filters by a case-insensitive substring of the name', async () => {
      const res = await request(app)
        .get('/v1/locations')
        .query({ search: `${PREFIX}search malm` });

      expect(res.status).toBe(200);
      expect(res.body.data.map(row => row.name)).toEqual([named('Search Malmö')]);
      expect(res.body.pagination.totalCount).toBe(1);
    });

    it('matches the search against provider_name too', async () => {
      const res = await request(app)
        .get('/v1/locations')
        .query({ search: `${PREFIX}provider uppsala` });

      expect(res.status).toBe(200);
      expect(res.body.data.map(row => row.name)).toEqual([named('Search Uppsala')]);
    });

    it('returns 400 for an invalid page', async () => {
      const res = await request(app).get('/v1/locations').query({ page: 0 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/locations/:id', () => {
    it('returns the location', async () => {
      const created = await createLocation({ name: named('Show me'), ...stockholm });

      const res = await request(app).get(`/v1/locations/${created.body.data.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(created.body.data);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app).get('/v1/locations/2147483647');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ code: 404, message: 'Location not found' });
    });

    it('returns 400 for a non-integer id', async () => {
      const res = await request(app).get('/v1/locations/abc');
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /v1/locations/:id', () => {
    it('returns 401 without the auth cookie', async () => {
      const res = await request(app)
        .patch('/v1/locations/1')
        .send({ name: named('nope') });
      expect(res.status).toBe(401);
    });

    it('updates the given fields and stamps updated_at', async () => {
      const created = await createLocation({ name: named('Rename me'), ...stockholm });
      const id = created.body.data.id;

      const res = await request(app)
        .patch(`/v1/locations/${id}`)
        .set('Cookie', getAuthCookie())
        .send({ name: named('Renamed'), lat: 60.1282, lon: 18.6435 });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ id, name: named('Renamed'), lat: 60.128, lon: 18.644 });
      expect(typeof res.body.data.updated_at).toBe('string');

      const shown = await request(app).get(`/v1/locations/${id}`);
      expect(shown.body.data).toEqual(res.body.data);
    });

    it('leaves fields that were not sent untouched', async () => {
      const created = await createLocation({ name: named('Partial'), ...stockholm });
      const id = created.body.data.id;

      const res = await request(app).patch(`/v1/locations/${id}`).set('Cookie', getAuthCookie()).send({ lat: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ name: named('Partial'), lat: 10, lon: 18.069 });
    });

    it('updates provider_name', async () => {
      const created = await createLocation({ name: named('Provider patch'), ...stockholm });
      const id = created.body.data.id;

      const res = await request(app)
        .patch(`/v1/locations/${id}`)
        .set('Cookie', getAuthCookie())
        .send({ provider_name: '  Stockholms län ' });

      expect(res.status).toBe(200);
      expect(res.body.data.provider_name).toBe('Stockholms län');
    });

    it.each([
      ['null', null],
      ['an empty string', ''],
    ])('returns 400 when provider_name is %s', async (_label, provider_name) => {
      const created = await createLocation({ name: named(`Keep provider ${_label}`), ...stockholm });

      const res = await request(app)
        .patch(`/v1/locations/${created.body.data.id}`)
        .set('Cookie', getAuthCookie())
        .send({ provider_name });

      expect(res.status).toBe(400);
    });

    it('returns 400 when no updatable field is sent', async () => {
      const created = await createLocation({ name: named('Empty patch'), ...stockholm });

      const res = await request(app)
        .patch(`/v1/locations/${created.body.data.id}`)
        .set('Cookie', getAuthCookie())
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ code: 400, message: 'No fields to update' });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .patch('/v1/locations/2147483647')
        .set('Cookie', getAuthCookie())
        .send({ name: named('ghost') });

      expect(res.status).toBe(404);
    });

    it("returns 409 when renaming onto another row's name in a different case", async () => {
      await createLocation({ name: named('Taken'), ...stockholm });
      const other = await createLocation({ name: named('Free'), ...stockholm });

      const res = await request(app)
        .patch(`/v1/locations/${other.body.data.id}`)
        .set('Cookie', getAuthCookie())
        .send({ name: named('TAKEN') });

      expect(res.status).toBe(409);
    });

    it('allows changing only the case of a row’s own name', async () => {
      const created = await createLocation({ name: named('recase'), ...stockholm });

      const res = await request(app)
        .patch(`/v1/locations/${created.body.data.id}`)
        .set('Cookie', getAuthCookie())
        .send({ name: named('RECASE') });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(named('RECASE'));
    });
  });

  describe('DELETE /v1/locations/:id', () => {
    it('returns 401 without the auth cookie', async () => {
      const res = await request(app).delete('/v1/locations/1');
      expect(res.status).toBe(401);
    });

    it('deletes the row and 404s afterwards', async () => {
      const created = await createLocation({ name: named('Delete me'), ...stockholm });
      const id = created.body.data.id;

      const res = await request(app).delete(`/v1/locations/${id}`).set('Cookie', getAuthCookie());
      expect(res.status).toBe(204);
      expect(res.text).toBe('');

      const shown = await request(app).get(`/v1/locations/${id}`);
      expect(shown.status).toBe(404);

      const again = await request(app).delete(`/v1/locations/${id}`).set('Cookie', getAuthCookie());
      expect(again.status).toBe(404);
    });
  });

  describe('GET /v1/locations/meta', () => {
    it('returns 401 without the auth cookie', async () => {
      const res = await request(app).get('/v1/locations/meta');
      expect(res.status).toBe(401);
    });

    it('lists the model fields', async () => {
      const res = await request(app).get('/v1/locations/meta').set('Cookie', getAuthCookie());

      expect(res.status).toBe(200);
      expect(res.body.data.resource).toBe('Location');
      expect(res.body.data.values).toEqual(['id', 'name', 'provider_name', 'lat', 'lon', 'created_at', 'updated_at']);
    });

    it('returns distinct values for a valid field', async () => {
      const res = await request(app).get('/v1/locations/meta/name').set('Cookie', getAuthCookie());

      expect(res.status).toBe(200);
      expect(res.body.data.field).toBe('name');
      expect(Array.isArray(res.body.data.values)).toBe(true);
    });

    it('returns 404 for an unknown field', async () => {
      const res = await request(app).get('/v1/locations/meta/not_a_column').set('Cookie', getAuthCookie());

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ code: 404, message: 'Field not found for the requested resource' });
    });
  });

  describe('CORS', () => {
    it('opens public routes to any origin', async () => {
      const res = await request(app).get('/v1/locations').set('Origin', OTHER_ORIGIN);

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('*');
    });

    it('restricts meta routes to the allowlist', async () => {
      const denied = await request(app).get('/v1/locations/meta').set('Origin', OTHER_ORIGIN);
      expect(denied.status).toBe(403);

      const allowed = await request(app)
        .get('/v1/locations/meta')
        .set('Origin', ALLOWED_ORIGIN)
        .set('Cookie', getAuthCookie());
      expect(allowed.status).toBe(200);
      expect(allowed.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
      expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    });

    it('judges a preflight by the method it asks about', async () => {
      const patchPreflight = await request(app)
        .options('/v1/locations/1')
        .set('Origin', OTHER_ORIGIN)
        .set('Access-Control-Request-Method', 'PATCH');
      expect(patchPreflight.status).toBe(403);

      const getPreflight = await request(app)
        .options('/v1/locations/1')
        .set('Origin', OTHER_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');
      expect(getPreflight.status).toBe(204);
      expect(getPreflight.headers['access-control-allow-origin']).toBe('*');
    });
  });
});
