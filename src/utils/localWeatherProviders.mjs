import smhiService from "../services/smhi.service.mjs";
import smhiDto from "../dtos/smhi.dto.mjs";

const localWeatherProviders = {
    SE: {
        name: "SMHI",
        service: smhiService,
        dto: smhiDto,
    }
}

export default localWeatherProviders;