import { translateEpochDay } from "../utils/dateTimeHelpers.mjs";

const openWeatherMapsDto = {
    currentWeather: (data) => {
        if (!data) return null;
        const percipitationType = getPercipitationType(data);
        return {
            weather: data?.weather?.main,
            description: data?.weather?.description,
            icon: data?.weather?.icon,
            dt: data.dt,
            location: {
                country_code: data?.sys?.country,
                coords: data?.coord,
                name: data?.name,
                timezone: data?.timezone
            },
            temprature: {
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
            wind: data?.wind,
            precipitation: {
                amount: percipitationType ? data[`${percipitationType}`]?.["1h"] : 0,
                hours_measured: 1,
                type: percipitationType ?? "none",
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
            const item = forecastData.list[i];
            const percipitationType = percipitationType(item);
            const timeObj = {
                dt: item.dt,
                weather: item.weather.main,
                description: item.weather.description,
                icon: item.weather.icon,
                temprature: {
                    temp: item.main?.temp,
                    feels_like: item.main.feels_like,
                    max: item.main?.temp_max,
                    mix: item.main?.temp_mix,
                },
                pressure: item.main.pressure,
                humidity: item.main.humidity,
                elevation: {
                    sea_level: item.main.sea_level,
                    ground_level: item.main.grnd_level,
                },
                wind: item.wind,
                clouds: item.clouds,
                visibility: item.visibility,
                precipitation: {
                    amount: percipitationType ? data[`${percipitationType}`]?.["3h"] : 0,
                    hours_measured: 3,
                    type: percipitationType ?? "none",
                },
            }
            formatted[day].push(timeObj);
        }
        return {list: formatted, provider: "openweathermaps.org"};
    }
}

const getPercipitationType = (data) => {
    switch (data) {
        case data.rain != undefined:
            return "rain";
        case data.snow != undefined:
            return "snow";
        case data.hail != undefined:
            return "hail";
        default:
            return null;
    }
}
export default openWeatherMapsDto;