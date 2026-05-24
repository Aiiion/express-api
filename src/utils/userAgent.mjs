import { GITHUB } from "./constants.mjs";
const sitename = process.env.SITE_NAME ?? 'express-api';

const userAgent = {
    headers: { 'User-Agent': `${sitename} ${GITHUB}` },
};

export default userAgent;
