import axios from "axios";
import { SMHI_WPT_API_URL } from "../utils/constants.mjs";

export const weatherWarnings = async (lat, lon) => 
    axios({
        method: 'get',
        url: SMHI_WPT_API_URL + `/warnings/most-severe/lat/${lat}/lon/${lon}`,
    });