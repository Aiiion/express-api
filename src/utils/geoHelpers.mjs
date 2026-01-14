export const isPointInSmhiBounds = (lat, lon) => {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  if (
    latNum >= 55.35 &&
    latNum <= 69.06 &&
    lonNum >= 11.11 &&
    lonNum <= 24.15
  ) {
    return true;
  } else {
    return false;
  }
};