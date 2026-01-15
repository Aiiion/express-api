import axios from "axios";
import { SMHI_WPT_API_URL } from "../utils/constants.mjs";
import smhiDto from "../dtos/smhi.dto.mjs";

const smhiService = {
    weatherWarnings: async (lat, lon) => {
        const response = await axios({
            method: 'get',
            url: SMHI_WPT_API_URL + `/warnings/most-severe/lat/${lat}/lon/${lon}`,
            timeout: 2000,
        });
        return smhiDto.weatherWarnings(response);
    }
};

export default smhiService;