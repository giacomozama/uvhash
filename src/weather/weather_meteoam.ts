import fetch, { URL } from "gnim/fetch";
import { HourlyWeatherData, WeatherType } from "./types";
import config from "../config";

type MeteoAMResponseRaw = {
    timeseries: string[];
    datasets: {
        // data
        "0": {
            // temperature
            "0": { [key: string]: number };
            // rainProbability
            "3": { [key: string]: number };
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
        case "06":
        case "07":
        case "18":
        case "35":
            return WeatherType.Overcast;
        case "08":
        case "09":
        case "11":
        case "12":
        case "15":
            return WeatherType.Rain;
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
        default:
            throw new Error("Unknown weather type");
    }
}

async function parseResponse(responseRaw: MeteoAMResponseRaw): Promise<HourlyWeatherData[]> {
    const response = {
        timeseries: responseRaw.timeseries,
        datasets: {
            data: {
                temperature: responseRaw.datasets["0"]["0"],
                rainProbability: responseRaw.datasets["0"]["3"],
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

        const hourlyData: HourlyWeatherData = {
            time,
            weatherType,
            temperature,
            rainProbability,
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
