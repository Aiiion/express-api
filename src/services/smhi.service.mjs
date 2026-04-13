import { SMHI_WPT_API_URL } from "../utils/constants.mjs";

const smhiService = {
    weatherWarnings: async (lat, lon) => {
        const response = await fetch(`${SMHI_WPT_API_URL}/warnings/most-severe/lat/${lat}/lon/${lon}`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) throw new Error(`SMHI error: ${response.status} ${response.statusText}`);
        return response.json();
    }
};

export default smhiService;