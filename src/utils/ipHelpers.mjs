export const extractIp = (req) => {
    const xff = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(xff) ? xff[0] : xff?.split(',')[0]?.trim();
    return forwardedIp || req.ip;
}