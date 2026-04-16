const parseAllowlist = (envValue = '') => {
    return [...new Set(
        envValue
            .split(',')
            .map((origin) => origin.trim())
            .filter(Boolean)
    )];
};

const getCorsAllowlist = (env = process.env) => {
    const configuredOrigins = env.CORS_ALLOWLIST ?? '';
    return parseAllowlist(configuredOrigins);
};

export const createCorsError = () => {
    const error = new Error('Origin not allowed by CORS');
    error.status = 403;
    return error;
};

export const createStrictCorsOptionsDelegate = (overrides = {}) => {
    return (req, callback) => {
        const requestOrigin = req.header('Origin');
        const allowlist = getCorsAllowlist();

        if (!requestOrigin) {
            callback(createCorsError());
            return;
        }

        if (!allowlist.includes(requestOrigin)) {
            callback(createCorsError());
            return;
        }

        callback(null, {
            ...overrides,
            origin: true,
            credentials: true,
        });
    };
};

export { getCorsAllowlist, parseAllowlist };