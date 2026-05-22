import smhiService from "../services/smhi.service.mjs";
import smhiDto from "../dtos/smhi.dto.mjs";
import yrService from "../services/yr.service.mjs";
import yrDto from "../dtos/yr.dto.mjs";

const localWeatherProviders = {
    SE: {
        name: "SMHI",
        service: smhiService,
        dto: smhiDto,
    },
    NO: {
        name: "Yr",
        service: yrService,
        dto: yrDto,
    },
}

export default localWeatherProviders;