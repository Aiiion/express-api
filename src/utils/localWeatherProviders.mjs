import smhiService from "../services/smhi.service.mjs";
import smhiDto from "../dtos/smhi.dto.mjs";
import metService from "../services/met.service.mjs";
import metDto from "../dtos/met.dto.mjs";

const localWeatherProviders = {
    SE: {
        name: "SMHI",
        service: smhiService,
        dto: smhiDto,
    },
    NO: {
        name: "Yr",
        service: metService,
        dto: metDto,
    },
}

export default localWeatherProviders;