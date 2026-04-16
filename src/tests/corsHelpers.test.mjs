import { createStrictCorsOptionsDelegate, getCorsAllowlist, parseAllowlist } from '../utils/corsHelpers.mjs';

describe('corsHelpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CORS_ALLOWLIST;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('parses a comma-separated allowlist', () => {
    expect(parseAllowlist(' http://localhost:3000,https://example.com, http://localhost:3000 ')).toEqual([
      'http://localhost:3000',
      'https://example.com',
    ]);
  });

  it('reads allowed origins from CORS_ALLOWLIST', () => {
    process.env.CORS_ALLOWLIST = 'http://localhost:3000,https://example.com';

    expect(getCorsAllowlist()).toEqual([
      'http://localhost:3000',
      'https://example.com',
    ]);
  });

  it('allows an exact matching origin and enables credentials', () => {
    process.env.CORS_ALLOWLIST = 'http://localhost:3000,https://example.com';

    const delegate = createStrictCorsOptionsDelegate({ methods: ['GET'] });
    const req = {
      header(name) {
        return name === 'Origin' ? 'https://example.com' : undefined;
      },
    };

    delegate(req, (error, options) => {
      expect(error).toBeNull();
      expect(options).toEqual({
        methods: ['GET'],
        origin: true,
        credentials: true,
      });
    });
  });

  it('rejects an origin that is not in the allowlist', () => {
    process.env.CORS_ALLOWLIST = 'http://localhost:3000';

    const delegate = createStrictCorsOptionsDelegate();
    const req = {
      header(name) {
        return name === 'Origin' ? 'https://evil.example' : undefined;
      },
    };

    delegate(req, (error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Origin not allowed by CORS');
      expect(error.status).toBe(403);
    });
  });

  it('does not reject requests that do not include an origin header', () => {
    process.env.CORS_ALLOWLIST = 'http://localhost:3000';

    const delegate = createStrictCorsOptionsDelegate({ allowedHeaders: ['Content-Type'] });
    const req = {
      header() {
        return undefined;
      },
    };

    delegate(req, (error, options) => {
      expect(error).toBeNull();
      expect(options).toEqual({
        allowedHeaders: ['Content-Type'],
        origin: false,
      });
    });
  });
});