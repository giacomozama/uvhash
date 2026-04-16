import fetch, { URL } from "gnim/fetch";
import { HourlyWeatherData, WeatherType, WindDirection } from "./types";
import config from "../config";

type MeteoAMResponseRaw = {
    timeseries: string[];
    datasets: {
        // data
        "0": {
            // temperature
            "0": { [key: string]: number };
            // humidity
            "1": { [key: string]: number };
            // rainProbability
            "3": { [key: string]: number };
            // windDirection
            "5": { [key: string]: string };
            // windSpeed
            "7": { [key: string]: number };
            // wheatherType
            "9": { [key: string]: string };
        };
    };
};

function parseWeatherType(raw: string) {
    switch (raw) {
        case "01":
            return WeatherType.ClearDay;
        case "02":
        case "03":
        case "04":
            return WeatherType.FewCloudsDay;
        case "05":
            return WeatherType.CloudsDay;
        case "06":
        case "07":
        case "18":
            return WeatherType.Overcast;
        case "08":
            return WeatherType.RainScattered;
        case "09":
            return WeatherType.Rain;
        case "12":
            return WeatherType.FreezingRain;
        case "15":
            return WeatherType.Hail;
        case "11":
            return WeatherType.SnowRain;
        case "10":
            return WeatherType.Storm;
        case "13":
        case "14":
        case "36":
            return WeatherType.Fog;
        case "16":
            return WeatherType.Snow;
        case "17":
        case "19":
            return WeatherType.Tornado;
        case "31":
            return WeatherType.ClearNight;
        case "32":
        case "33":
        case "34":
            return WeatherType.FewCloudsNight;
        case "35":
            return WeatherType.CloudsNight;
        default:
            return WeatherType.Unknown;
    }
}

function parseWindDirection(raw: string): WindDirection {
    switch (raw) {
        case "N":
            return WindDirection.N;
        case "N-NE":
            return WindDirection.N_NE;
        case "NE":
            return WindDirection.NE;
        case "E-NE":
            return WindDirection.E_NE;
        case "E":
            return WindDirection.E;
        case "E-SE":
            return WindDirection.E_SE;
        case "SE":
            return WindDirection.SE;
        case "S-SE":
            return WindDirection.S_SE;
        case "S":
            return WindDirection.S;
        case "S-SW":
            return WindDirection.S_SW;
        case "SW":
            return WindDirection.SW;
        case "W-SW":
            return WindDirection.W_SW;
        case "W":
            return WindDirection.W;
        case "W-NW":
            return WindDirection.W_NW;
        case "NW":
            return WindDirection.NW;
        case "N-NW":
            return WindDirection.N_NW;
        default:
            return WindDirection.N;
    }
}

async function parseResponse(responseRaw: MeteoAMResponseRaw): Promise<HourlyWeatherData[]> {
    const response = {
        timeseries: responseRaw.timeseries,
        datasets: {
            data: {
                temperature: responseRaw.datasets["0"]["0"],
                humidity: responseRaw.datasets["0"]["1"],
                rainProbability: responseRaw.datasets["0"]["3"],
                windDirection: responseRaw.datasets["0"]["5"],
                windSpeed: responseRaw.datasets["0"]["7"],
                weatherType: responseRaw.datasets["0"]["9"],
            },
        },
    };

    const hourlyWeatherData = [];

    for (let i = 0; i < response.timeseries.length; i++) {
        const time = new Date(Date.parse(response.timeseries[i]));
        const indexKey = i.toString();
        const weatherType = parseWeatherType(response.datasets.data.weatherType[indexKey]);
        const temperature = response.datasets.data.temperature[indexKey];
        const rainProbability = response.datasets.data.rainProbability[indexKey];
        const humidity = response.datasets.data.humidity[indexKey];
        const windDirection = parseWindDirection(response.datasets.data.windDirection[indexKey]);
        const windSpeed = response.datasets.data.windSpeed[indexKey];

        const hourlyData: HourlyWeatherData = {
            time,
            weatherType,
            temperature,
            rainProbability,
            humidity,
            windDirection,
            windSpeed,
        };

        hourlyWeatherData.push(hourlyData);
    }

    return hourlyWeatherData;
}

export async function loadMeteoAMWeatherData(): Promise<HourlyWeatherData[]> {
    const coords = "44.471802,11.26499";
    const url = new URL(`https://api.meteoam.it/deda-meteograms/api/GetMeteogram/preset1/${coords}`);

    try {
        const r = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": `${config.shellName} ${config.shellVersion}`,
            },
        });
        const raw = (await r.json()) as MeteoAMResponseRaw;

        return await parseResponse(raw);
    } catch (e) {
        printerr(e);
        return [];
    }
}
