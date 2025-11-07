export enum WeatherType {
    ClearDay,
    ClearNight,
    FewCloudsDay,
    FewCloudsNight,
    Overcast,
    Rain,
    Storm,
    Snow,
    Fog,
    Tornado,
}

export type HourlyWeatherData = {
    time: Date;
    weatherType: WeatherType;
    temperature: number;
    rainProbability: number;
};
