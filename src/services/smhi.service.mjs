import axios from "axios";
import { SMHI_WPT_API_URL } from "../utils/constants.mjs";

const smhiService = {
    weatherWarnings: async (lat, lon) => {
        const response = await axios({
            method: 'get',
            url: SMHI_WPT_API_URL + `/warnings/most-severe/lat/${lat}/lon/${lon}`,
            timeout: 2000,
        });
        return response.data;
    }
};

export default smhiService;