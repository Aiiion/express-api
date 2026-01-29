import weatherApiService from "../services/weatherApi.service.mjs";
import weatherApiDto from "../dtos/weatherApi.dto.mjs";
import localWeatherProviders from "./localWeatherProviders.mjs";

const boundsArray = [
  {
    country: "Sweden",
    provider: localWeatherProviders.SE,
    latMin: 55.35,
    latMax: 69.06,
    lonMin: 11.11,
    lonMax: 24.15,
  },

];

export const getCoordinateBound = (lat, lon) => {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  for (const bound of boundsArray) {
    if (
      latNum >= bound.latMin &&
      latNum <= bound.latMax &&
      lonNum >= bound.lonMin &&
      lonNum <= bound.lonMax
    ) {
      return bound;
    }
  }
  return { 
    country: "Global", 
    provider: { 
      service: weatherApiService, 
      dto: weatherApiDto 
    }
  };
};