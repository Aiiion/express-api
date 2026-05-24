import { GITHUB } from "./constants.mjs";
const siteName = process.env.SITE_NAME ?? 'express-api';

const userAgent = {
    headers: { 'User-Agent': `${siteName} (${GITHUB})` },
};

export default userAgent;
