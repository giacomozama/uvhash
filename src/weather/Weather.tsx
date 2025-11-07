import { Gtk } from "ags/gtk4";
import { CURSOR_POINTER } from "../utils/gtk";
import { createRoot, For } from "gnim";
import { HourlyWeatherData, WeatherType } from "./types";
import { refreshWeatherData, weatherData } from "./weather_state";

const HOURLY_ITEM_WIDTH = 120;

function weatherTypeIconName(weatherType: WeatherType) {
    switch (weatherType) {
        case WeatherType.ClearDay:
            return "weather-clear";
        case WeatherType.ClearNight:
            return "weather-clear-night";
        case WeatherType.FewCloudsDay:
            return "weather-few-clouds";
        case WeatherType.FewCloudsNight:
            return "weather-few-clouds-night";
        case WeatherType.Overcast:
            return "weather-overcast";
        case WeatherType.Rain:
            return "weather-showers";
        case WeatherType.Storm:
            return "weather-storm";
        case WeatherType.Snow:
            return "weather-snow";
        case WeatherType.Fog:
            return "weather-fog";
        case WeatherType.Tornado:
            return "weather-tornado";
    }
}

const previewHourlyItem = weatherData.as((data) => {
    const now = Date.now();
    return data.find((h) => h.time.getTime() + 3_600_000 >= now);
});

const previewIcon = previewHourlyItem.as((h) => (h ? weatherTypeIconName(h.weatherType) : "weather-clear"));

const previewTemperature = previewHourlyItem.as((h) => (h ? `${h.temperature.toFixed(0)} °C` : "- °C"));

function HourlyWeatherItem({ data }: { data: HourlyWeatherData }) {
    const day = data.time.getDate().toString().padStart(2, "0");
    const month = (data.time.getMonth() + 1).toString().padStart(2, "0");
    const formattedDate = `${day}/${month}`;
    const formattedTime = `${data.time.getHours().toString().padStart(2, "0")}:00`;

    return (
        <box
            orientation={Gtk.Orientation.VERTICAL}
            hexpand={true}
            vexpand={true}
            widthRequest={HOURLY_ITEM_WIDTH}
            cssClasses={["hourly-weather-item"]}
        >
            <label label={formattedDate} cssClasses={["date"]} />
            <label label={formattedTime} cssClasses={["time"]} />
            <image cssClasses={["weather-type-icon"]} iconName={weatherTypeIconName(data.weatherType)} marginTop={18} />
            <box vexpand={true} />
            {data.rainProbability && (
                <box class="rain-probability" halign={Gtk.Align.CENTER} marginBottom={4}>
                    <image iconName={"rain-symbolic"} marginEnd={8} />
                    <label label={`${data.rainProbability.toFixed(0)}%`} />
                </box>
            )}
            <box halign={Gtk.Align.CENTER}>
                <image iconName={"temperature"} marginEnd={8} />
                <label class="temperature-label" label={`${data.temperature.toFixed(0)} °C`} />
            </box>
        </box>
    );
}

function WeatherPopover() {
    const hadjustment = new Gtk.Adjustment();
    let startIndex = 0;

    return (
        <glassypopover heightRequest={400} onShow={() => hadjustment.set_value(HOURLY_ITEM_WIDTH * startIndex)}>
            <box orientation={Gtk.Orientation.VERTICAL} cssClasses={["popover-standard-inner"]}>
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName={previewIcon} halign={Gtk.Align.START} />
                    <label label="Weather" xalign={0} hexpand={true} />
                    <button cursor={CURSOR_POINTER} valign={Gtk.Align.CENTER} onClicked={() => refreshWeatherData()}>
                        <box spacing={12}>
                            <image iconName="view-refresh-symbolic" />
                            <label label="Refresh" />
                        </box>
                    </button>
                </box>
                <scrolledwindow
                    overlayScrolling={true}
                    widthRequest={HOURLY_ITEM_WIDTH * 5 - 1}
                    hadjustment={hadjustment}
                    child={weatherData.as((data) =>
                        createRoot((dispose) => {
                            if (!data?.length) {
                                return (
                                    <box
                                        vexpand={true}
                                        hexpand={true}
                                        class="popover-message"
                                        orientation={Gtk.Orientation.VERTICAL}
                                        valign={Gtk.Align.CENTER}
                                    >
                                        <label
                                            label="No weather data available"
                                            hexpand={true}
                                            vexpand={true}
                                            xalign={0.5}
                                        />
                                    </box>
                                ) as Gtk.Widget;
                            }

                            const now = Date.now();

                            startIndex = 0;

                            for (let i = 0; i < data.length; i++) {
                                if (data[i].time.getTime() + 3_600_000 >= now) {
                                    startIndex = i;
                                    break;
                                }
                            }

                            hadjustment.configure(
                                HOURLY_ITEM_WIDTH * startIndex,
                                0,
                                HOURLY_ITEM_WIDTH * data.length,
                                HOURLY_ITEM_WIDTH,
                                0,
                                0
                            );

                            return (
                                <box
                                    orientation={Gtk.Orientation.HORIZONTAL}
                                    vexpand={true}
                                    onNotifyParent={(self) => {
                                        if (!self.get_parent()) {
                                            dispose();
                                        }
                                    }}
                                >
                                    {data.map((hd) => (
                                        <HourlyWeatherItem data={hd} />
                                    ))}
                                </box>
                            ) as Gtk.Widget;
                        })
                    )}
                />
            </box>
        </glassypopover>
    );
}

export function WeatherVisualizer() {
    return (
        <box
            cssClasses={["weather-visualizer"]}
            layoutManager={new Gtk.BinLayout()}
            hexpandSet={true}
            overflow={Gtk.Overflow.HIDDEN}
        >
            <box orientation={Gtk.Orientation.VERTICAL} hexpand={true}>
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName={previewIcon} halign={Gtk.Align.START} />
                    <label label="Weather" xalign={0} hexpand={true} />
                    <button cursor={CURSOR_POINTER} valign={Gtk.Align.CENTER} onClicked={() => refreshWeatherData()}>
                        <box spacing={12}>
                            <image iconName="view-refresh-symbolic" />
                            <label label="Refresh" />
                        </box>
                    </button>
                </box>
                <box vexpand={true}>
                    <box orientation={Gtk.Orientation.VERTICAL}>
                        <box class="current-weather" halign={Gtk.Align.CENTER} valign={Gtk.Align.START}>
                            <image
                                cssClasses={["weather-type-icon"]}
                                iconName={previewIcon}
                                marginEnd={24}
                                pixelSize={128}
                            />
                            <label
                                class={"temp"}
                                label={previewHourlyItem.as((d) => (d?.temperature ?? "-") + "°C")}
                                valign={Gtk.Align.CENTER}
                            />
                        </box>
                        <scrolledwindow >
                            <box vexpand={true} class={"hourly-list"}>
                                <For each={weatherData}>{(data) => <HourlyWeatherItem data={data} />}</For>
                            </box>
                        </scrolledwindow>
                    </box>
                </box>
            </box>
            <box class={"gloss"} canFocus={false} canTarget={false} />
        </box>
    );
}

export function WeatherButton() {
    return (
        <menubutton
            widthRequest={100}
            cssClasses={["bar-button", "weather"]}
            cursor={CURSOR_POINTER}
            halign={Gtk.Align.START}
        >
            <box>
                <image iconName={previewIcon} marginEnd={12} />
                <label label={previewTemperature} xalign={0.5} hexpand={true} halign={Gtk.Align.CENTER} />
            </box>
            <WeatherPopover />
        </menubutton>
    );
}
