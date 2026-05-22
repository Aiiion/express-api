import { createRequire } from "module";
import weatherApiService from "../services/weatherApi.service.mjs";
import weatherApiDto from "../dtos/weatherApi.dto.mjs";
import localWeatherProviders from "./localWeatherProviders.mjs";

const require = createRequire(import.meta.url);

// Ray casting algorithm: returns true if (lat, lon) is inside the GeoJSON polygon ring.
const pointInRing = (lat, lon, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]; // GeoJSON coords are [lon, lat]
    const [xj, yj] = ring[j];
    const intersects =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};

// Handles both Polygon and MultiPolygon geometries.
const pointInGeometry = (lat, lon, geometry) => {
  if (geometry.type === "Polygon") {
    return pointInRing(lat, lon, geometry.coordinates[0]);
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => pointInRing(lat, lon, polygon[0]));
  }
  return false;
};

const bordersArray = [
  {
    country: "Sweden",
    provider: localWeatherProviders.SE,
    geometry: require("../data/borders/SE.json"),
  },
  {
    country: "Norway",
    provider: localWeatherProviders.NO,
    geometry: require("../data/borders/NO.json"),
  },
];

export const getCoordinateBound = (lat, lon) => {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  for (const entry of bordersArray) {
    if (pointInGeometry(latNum, lonNum, entry.geometry)) {
      return entry;
    }
  }

  return {
    country: "Global",
    provider: {
      service: weatherApiService,
      dto: weatherApiDto,
    },
  };
};