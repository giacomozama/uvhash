import config from "../config";
import { createPollState } from "../utils/gnim";

const [weatherData, setWeatherData] = createPollState([], config.weather.updateInterval, config.weather.dataProvider);

export { weatherData };

export function refreshWeatherData() {
    config.weather.dataProvider().then(setWeatherData);
}
