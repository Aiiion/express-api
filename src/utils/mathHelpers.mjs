export const kphToMs = (kph, precision = 3) => {
    if(kph !== 0 &&!kph) return null;
    return parseFloat((kph / 3.6).toFixed(precision));
};

export const celsiusToFahrenheit = (c, precision = 2) => {
    if (c !== 0 && !c) return null;
    return parseFloat(((c * 9) / 5 + 32).toFixed(precision));
};

export const msToMph = (ms, precision = 3) => {
    if (ms !== 0 && !ms) return null;
    return parseFloat((ms * 2.23694).toFixed(precision));
};

export const mmToInches = (mm, precision = 4) => {
    if (mm !== 0 && !mm) return null;
    return parseFloat((mm / 25.4).toFixed(precision));
};