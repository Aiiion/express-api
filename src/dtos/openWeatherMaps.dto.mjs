import { translateEpochDay } from "../utils/dateTimeHelpers.mjs";

const openWeatherMapsDto = {
    currentWeather: (data) => {
        if (!data) return null;
        const precipitationType = getPrecipitationType(data);
        const weatherEntry = Array.isArray(data?.weather) ? data.weather[0] : data?.weather;
        return {
            weather: weatherEntry?.main,
            description: weatherEntry?.description,
            icon: weatherEntry?.icon,
            dt: data.dt,
            location: {
                country_code: data?.sys?.country,
                coords: data?.coord,
                name: data?.name,
                timezone: data?.timezone
            },
            temperature: {
                temp: data?.main?.temp,
                min: data?.main?.temp_min,
                max: data?.main?.temp_max,
                feels_like: data?.main?.feels_like
            },
            pressure: data?.main?.pressure,
            humidity: data?.main?.humidity,
            visibility: data?.visibility,
            clouds: data?.clouds,
            elevation: {
                sea_level: data?.main?.sea_level,
                ground_level: data?.main?.grnd_level,
            },
            wind: {
                speed: data?.wind?.speed,
                deg: data?.wind?.deg,
                dir: null,
                gust: null,
            },
            precipitation: {
                amount: precipitationType ? data[`${precipitationType}`]?.["1h"] : 0,
                hours_measured: 1,
                type: precipitationType ?? "none",
            },
            sunrise: data.sys?.sunrise,
            sunset: data.sys?.sunset,
            uv: null,
            provider: "openweathermaps.org"
        }
    },
    forecastWeather: (data) => {
        if (!data) return null;
        const formatted = {};

        for (let i = 0; i < data.list.length; i++) {
            const day = translateEpochDay(data.list[i].dt);
            if (!formatted[day]) {
                formatted[day] = [];
            }
            const item = data?.list[i];
            const precipitationType = getPrecipitationType(item);
            const weatherEntry = Array.isArray(item?.weather) ? item.weather[0] : item?.weather;
            const timeObj = {
                dt: item?.dt,
                weather: weatherEntry?.main,
                description: weatherEntry?.description,
                icon: weatherEntry?.icon,
                temperature: {
                    temp: item?.main?.temp,
                    feels_like: item?.main?.feels_like,
                    max: item?.main?.temp_max,
                    min: item?.main?.temp_min,
                },
                pressure: item?.main?.pressure,
                humidity: item?.main?.humidity,
                elevation: {
                    sea_level: item?.main?.sea_level,
                    ground_level: item?.main?.grnd_level,
                },
                wind: {
                    speed: item?.wind?.speed,
                    deg: item?.wind?.deg,
                    dir: null,
                    gust: null,
                },
                clouds: item?.clouds,
                visibility: item?.visibility,
                precipitation: {
                    amount: precipitationType ? item[`${precipitationType}`]?.["3h"] : 0,
                    hours_measured: 3,
                    type: precipitationType ?? "none",
                },
            }
            formatted[day].push(timeObj);
        }
        return { list: formatted, provider: "openweathermaps.org" };
    }
}

const getPrecipitationType = (data) => {
    if (data?.rain !== undefined) {
        return "rain";
    }
    if (data?.snow !== undefined) {
        return "snow";
    }
    if (data?.hail !== undefined) {
        return "hail";
    }
    return null;
}
export default openWeatherMapsDto;