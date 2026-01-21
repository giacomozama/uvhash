import { Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { CURSOR_POINTER } from "../utils/gtk";
import { Accessor, createEffect, createState, For, onCleanup, With } from "gnim";
import { HourlyWeatherData, WeatherType, WindDirection } from "./types";
import { weatherState } from "./weather_state";
import config from "../config";

const HOURLY_ITEM_HEIGHT = 85;

function windDirectionAngle(windDirection: WindDirection) {
    return (windDirection / 8) * Math.PI;
}

function weatherTypeIconName(weatherType: WeatherType) {
    switch (weatherType) {
        case WeatherType.ClearDay:
            return "weather-clear";
        case WeatherType.ClearNight:
            return "weather-clear-night";
        case WeatherType.FewCloudsDay:
            return "weather-clouds";
        case WeatherType.FewCloudsNight:
            return "weather-clouds-night";
        case WeatherType.Overcast:
            return "weather-overcast";
        case WeatherType.RainScattered:
            return "weather-showers-scattered";
        case WeatherType.Rain:
            return "weather-showers";
        case WeatherType.RainDay:
            return "weather-showers-day";
        case WeatherType.RainNight:
            return "weather-showers-night";
        case WeatherType.Storm:
            return "weather-storm";
        case WeatherType.StormDay:
            return "weather-storm-day";
        case WeatherType.StormNight:
            return "weather-storm-night";
        case WeatherType.SnowRain:
            return "weather-snow-rain";
        case WeatherType.Snow:
            return "weather-snow";
        case WeatherType.Mist:
            return "weather-mist";
        case WeatherType.Fog:
            return "weather-fog";
        case WeatherType.Tornado:
            return "weather-tornado";
        case WeatherType.CloudsDay:
            return "weather-few-clouds";
        case WeatherType.CloudsNight:
            return "weather-few-clouds-night";
        case WeatherType.RainScatteredDay:
            return "weather-showers-scattered-day";
        case WeatherType.RainScatteredNight:
            return "weather-showers-scattered-night";
        case WeatherType.FreezingRain:
            return "weather-freezing-rain";
        case WeatherType.Hail:
            return "weather-hail";
        default:
            return "weather-none-available";
    }
}

function weatherTypeLabel(weatherType: WeatherType) {
    switch (weatherType) {
        case WeatherType.ClearDay:
        case WeatherType.ClearNight:
            return "Clear";
        case WeatherType.FewCloudsDay:
        case WeatherType.FewCloudsNight:
            return "Few Clouds";
        case WeatherType.CloudsDay:
        case WeatherType.CloudsNight:
            return "Cloudy";
        case WeatherType.Overcast:
            return "Overcast";
        case WeatherType.Rain:
        case WeatherType.RainDay:
        case WeatherType.RainNight:
            return "Rain";
        case WeatherType.RainScattered:
        case WeatherType.RainScatteredDay:
        case WeatherType.RainScatteredNight:
            return "Scattered Rain";
        case WeatherType.FreezingRain:
            return "Freezing Rain";
        case WeatherType.Hail:
            return "Hail";
        case WeatherType.Storm:
        case WeatherType.StormDay:
        case WeatherType.StormNight:
            return "Storm";
        case WeatherType.Snow:
            return "Snow";
        case WeatherType.SnowRain:
            return "Snow/Rain";
        case WeatherType.Mist:
            return "Mist";
        case WeatherType.Fog:
            return "Fog";
        case WeatherType.Tornado:
            return "Tornado";
        default:
            return "Unknown";
    }
}

const previewHourlyItem = weatherState().weatherData.as((data) => {
    const now = Date.now();
    return data.find((h) => h.time.getTime() + 3_600_000 >= now);
});

const previewIcon = previewHourlyItem.as((h) => weatherTypeIconName(h?.weatherType ?? WeatherType.Unknown));

function WindIndicator({ direction, size }: { direction: WindDirection; size: number }) {
    return (
        <box widthRequest={size} heightRequest={size} class={"wind-indicator"} valign={Gtk.Align.CENTER}>
            <image
                iconName={"arrow4-right-symbolic"}
                css={`
                    transform: rotate(${windDirectionAngle(direction)}rad);
                `}
                pixelSize={size}
                valign={Gtk.Align.CENTER}
                halign={Gtk.Align.CENTER}
            />
        </box>
    );
}

function CurrentIndicator({ visible }: { visible: Accessor<boolean> }) {
    return (
        <drawingarea
            heightRequest={30}
            widthRequest={15}
            valign={Gtk.Align.CENTER}
            $={(self) => {
                self.set_draw_func((_, cr, width, height) => {
                    if (!visible.peek()) return;

                    const { red, green, blue } = config.colors.accent2;
                    cr.setSourceRGB(red, green, blue);
                    cr.moveTo(0, 0);
                    cr.lineTo(width, height / 2);
                    cr.lineTo(0, height);
                    cr.closePath();
                    cr.fill();
                    cr.$dispose();
                });

                createEffect(() => {
                    visible();
                    self.queue_draw();
                });
            }}
        />
    );
}

function HourlyWeatherItem({
    data,
    index,
    currentIndex,
}: {
    data: HourlyWeatherData;
    index: number;
    currentIndex: Accessor<number>;
}) {
    const day = data.time.getDate().toString().padStart(2, "0");
    const month = (data.time.getMonth() + 1).toString().padStart(2, "0");
    const formattedDate = `${day}/${month}`;
    const formattedTime = `${data.time.getHours().toString().padStart(2, "0")}:00`;

    const isCurrent = currentIndex.as((i) => i === index);

    return (
        <box
            cssClasses={isCurrent.as((c) => ["hourly-weather-item"].concat(c ? ["current"] : []))}
            valign={Gtk.Align.CENTER}
            hexpand={true}
            heightRequest={HOURLY_ITEM_HEIGHT}
        >
            <CurrentIndicator visible={isCurrent} />
            <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER} widthRequest={55} marginStart={12}>
                <label label={formattedDate} cssClasses={["date"]} />
                <label label={formattedTime} cssClasses={["time"]} />
            </box>
            <box hexpand={true} />
            <image
                cssClasses={["weather-type-icon"]}
                iconName={weatherTypeIconName(data.weatherType)}
                pixelSize={48}
                halign={Gtk.Align.CENTER}
                tooltipText={weatherTypeLabel(data.weatherType)}
            />
            <box hexpand={true} />
            <box class="weather-data" valign={Gtk.Align.CENTER} halign={Gtk.Align.END} spacing={18}>
                <box halign={Gtk.Align.START} valign={Gtk.Align.CENTER} tooltipText="Temperature">
                    <image iconName={"temperature"} marginEnd={8} valign={Gtk.Align.CENTER} />
                    <label
                        class="temperature-label"
                        label={`${data.temperature.toFixed(0)} °C`}
                        valign={Gtk.Align.CENTER}
                        widthRequest={60}
                    />
                </box>
                <box halign={Gtk.Align.START} valign={Gtk.Align.CENTER} tooltipText="Humidity">
                    <image iconName={"rain-symbolic"} marginEnd={8} valign={Gtk.Align.CENTER} />
                    <label
                        class="temperature-label"
                        label={`${data.humidity}%`}
                        valign={Gtk.Align.CENTER}
                        widthRequest={60}
                    />
                </box>
                <box class="rain" halign={Gtk.Align.START} valign={Gtk.Align.CENTER} tooltipText="Rain probability">
                    <image iconName={"umbrella"} marginEnd={8} valign={Gtk.Align.CENTER} />
                    <label label={`${data.rainProbability}%`} valign={Gtk.Align.CENTER} widthRequest={60} />
                </box>
                <box
                    class="wind"
                    halign={Gtk.Align.START}
                    valign={Gtk.Align.CENTER}
                    spacing={6}
                    tooltipText="Wind speed"
                >
                    <WindIndicator direction={data?.windDirection ?? 0} size={22} />
                    <label
                        class={"wind-speed"}
                        label={`${data?.windSpeed ?? "-"} km/h`}
                        valign={Gtk.Align.CENTER}
                        widthRequest={60}
                    />
                </box>
            </box>
        </box>
    );
}

export function WeatherVisualizer() {
    const vadjustment = new Gtk.Adjustment();
    const [currentIndex, setCurrentIndex] = createState(0);
    const timeTrigger = createPoll(0, 60000, (p) => p + 1);

    createEffect(() => {
        timeTrigger();
        const data = weatherState().weatherData();
        const now = Date.now();
        for (let i = 0; i < data.length; i++) {
            if (data[i].time.getTime() + 3_600_000 >= now) {
                setCurrentIndex(i);
                return;
            }
        }
        setCurrentIndex(0);
    });

    const jumpToCurrent = () => {
        const data = weatherState().weatherData();
        if (data.length > 0) {
            vadjustment.set_value(HOURLY_ITEM_HEIGHT * currentIndex());
        }
    };

    createEffect(() => {
        const index = currentIndex();
        const data = weatherState().weatherData();

        if (data.length > 0) {
            vadjustment.configure(
                HOURLY_ITEM_HEIGHT * index,
                0,
                HOURLY_ITEM_HEIGHT * data.length,
                HOURLY_ITEM_HEIGHT,
                0,
                0
            );
        }
    });

    return (
        <box
            cssClasses={["weather-panel"]}
            layoutManager={new Gtk.BinLayout()}
            hexpand={true}
            hexpandSet={true}
            vexpand={true}
            vexpandSet={true}
            overflow={Gtk.Overflow.HIDDEN}
        >
            <box orientation={Gtk.Orientation.VERTICAL} hexpand={true} vexpand={true}>
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName={previewIcon} halign={Gtk.Align.START} />
                    <label label="Weather" xalign={0} hexpand={true} />
                    <box hexpand={true} />
                    <button
                        cssClasses={["glassy-chip-button"]}
                        cursor={CURSOR_POINTER}
                        valign={Gtk.Align.CENTER}
                        onClicked={jumpToCurrent}
                    >
                        <box spacing={12}>
                            <image iconName="find-location-symbolic" />
                            <label label="Now" />
                        </box>
                    </button>
                    <button
                        cssClasses={["glassy-chip-button"]}
                        cursor={CURSOR_POINTER}
                        valign={Gtk.Align.CENTER}
                        marginStart={8}
                        onClicked={() => weatherState().refreshWeatherData()}
                    >
                        <box spacing={12}>
                            <image iconName="view-refresh-symbolic" />
                            <label label="Refresh" />
                        </box>
                    </button>
                </box>
                <scrolledwindow
                    hexpand={true}
                    vexpand={true}
                    vadjustment={vadjustment}
                    child={
                        (
                            <box class={"hourly-list"} orientation={Gtk.Orientation.VERTICAL}>
                                <For each={weatherState().weatherData}>
                                    {(data, i) => (
                                        <HourlyWeatherItem data={data} index={i()} currentIndex={currentIndex} />
                                    )}
                                </For>
                            </box>
                        ) as Gtk.Widget
                    }
                />
            </box>
            <box class={"gloss"} canFocus={false} canTarget={false} />
        </box>
    );
}
