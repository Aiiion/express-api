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

// Precomputes an axis-aligned bounding box for a Polygon or MultiPolygon.
// GeoJSON coordinates are [lon, lat], so index 0 = lon, index 1 = lat.
const computeBbox = (geometry) => {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  const rings =
    geometry.type === "Polygon"
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((polygon) => polygon[0]);
  for (const ring of rings) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return { minLon, maxLon, minLat, maxLat };
};

const pointInBbox = (lat, lon, bbox) =>
  lat >= bbox.minLat && lat <= bbox.maxLat && lon >= bbox.minLon && lon <= bbox.maxLon;

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
  {
    country: "Finland",
    provider: localWeatherProviders.FI,
    geometry: require("../data/borders/FI.json"),
  },
].map((entry) => ({ ...entry, bbox: computeBbox(entry.geometry) }));

export const getCoordinateBound = (lat, lon) => {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  for (const entry of bordersArray) {
    if (pointInBbox(latNum, lonNum, entry.bbox) && pointInGeometry(latNum, lonNum, entry.geometry)) {
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