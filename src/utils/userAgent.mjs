const sitename = process.env.SITE_NAME ?? 'express-api';

const userAgent = {
    headers: { 'User-Agent': sitename },
};

export default userAgent;
