import userAgent from "./userAgent.mjs";

/**
 * Shared HTTP client for external weather providers.
 * Applies the project User-Agent, a request timeout, and a single retry on
 * network errors, timeouts, and 5xx responses. 4xx responses are not retried
 * since they won't change on a second attempt.
 *
 * @param {string} provider - Name used in error messages, e.g. "SMHI"
 * @param {string} url - Full request URL
 * @param {{ timeout?: number, retries?: number, parse?: 'json'|'text' }} [options]
 * @returns {Promise<any>} Parsed JSON body, or raw text when parse is 'text'
 */
export const providerFetch = async (provider, url, { timeout = 2000, retries = 1, parse = 'json' } = {}) => {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(timeout), ...userAgent });
            if (response.ok) return parse === 'text' ? response.text() : response.json();
            lastError = new Error(`${provider} error: ${response.status} ${response.statusText}`);
            if (response.status < 500) break;
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError;
};
