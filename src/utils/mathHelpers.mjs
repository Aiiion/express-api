export const kphToMs = (kph, precision = 3) => {
    if(kph !== 0 &&!kph) return null;
    return parseFloat((kph / 3.6).toFixed(precision));
};