import { Astal, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { createRoot } from "gnim";
import config from "../config";
import { News } from "../news/News";
import { Finance } from "../finance/Finance";
import { DisplayClock } from "../display_clock/DisplayClock";
import { WeatherVisualizer } from "../weather/Weather";

export function BackgroundVisualizer() {
    const monitor = app.monitors.find((m) => m.connector === config.backgroundVisualizer.showOnMonitor);
    if (!monitor) return undefined;

    return createRoot((dispose) => {
        return (
            <window
                name="background-visualizer"
                class="BackgroundVisualizer"
                // MUST be above the gdkmonitor prop
                layer={Astal.Layer.BACKGROUND}
                gdkmonitor={monitor}
                exclusivity={Astal.Exclusivity.IGNORE}
                anchor={
                    Astal.WindowAnchor.TOP |
                    Astal.WindowAnchor.RIGHT |
                    Astal.WindowAnchor.BOTTOM |
                    Astal.WindowAnchor.LEFT
                }
                vexpand={true}
                hexpand={true}
                application={app}
                onDestroy={dispose}
                namespace={config.shellName}
            >
                <box hexpand={true} marginTop={8} marginEnd={8} marginBottom={84} marginStart={8} spacing={8}>
                    <News />
                    <Finance />
                    <box orientation={Gtk.Orientation.VERTICAL} spacing={8}>
                        <DisplayClock />
                        <WeatherVisualizer />
                    </box>
                </box>
            </window>
        );
    }) as Gtk.Window;
}
