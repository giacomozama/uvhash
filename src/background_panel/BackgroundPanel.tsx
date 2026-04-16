import { Astal, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { createRoot } from "gnim";
import config from "../config";
import { News } from "../news/News";
import { Finance } from "../finance/Finance";
import { DisplayClock } from "../display_clock/DisplayClock";
import { WeatherVisualizer } from "../weather/Weather";
import { backgroundPanelMonitor, setupBackgroundPanelWorkspaceTracking } from "../compositor/compositor";
import GObject from "gnim/gobject";

function layoutBackgroundPanels(
    grid: Gtk.Grid,
    newsPanel: GObject.Object,
    financePanel: GObject.Object,
    clockPanel: GObject.Object,
    weatherPanel: GObject.Object,
) {
    grid.attach(newsPanel as Gtk.Widget, 0, 0, 1, 2);
    grid.attach(financePanel as Gtk.Widget, 1, 0, 1, 2);
    grid.attach(clockPanel as Gtk.Widget, 2, 0, 1, 1);
    grid.attach(weatherPanel as Gtk.Widget, 2, 1, 1, 1);
}

export function BackgroundPanelShadow() {
    return createRoot((dispose) => (
        <window
            name="background-panel-shadow"
            class="BackgroundPanelShadow"
            // MUST be above the gdkmonitor prop
            layer={Astal.Layer.BACKGROUND}
            gdkmonitor={backgroundPanelMonitor}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={
                Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT | Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT
            }
            vexpand={true}
            hexpand={true}
            application={app}
            onCloseRequest={(self) => {
                dispose();
                self.destroy();
            }}
            namespace={`${config.shellName}-overlay`}
            $={(self) => {
                setupBackgroundPanelWorkspaceTracking(self);
            }}
        >
            <Gtk.Grid
                hexpand={true}
                vexpand={true}
                marginTop={8}
                marginEnd={8}
                marginBottom={32 + config.dock.itemSize}
                marginStart={8}
                rowSpacing={8}
                columnSpacing={8}
                columnHomogeneous={true}
                rowHomogeneous={true}
                $={(self) => {
                    layoutBackgroundPanels(
                        self,
                        <box class="background-panel-shadow" hexpand={true} vexpand={true} />,
                        <box class="background-panel-shadow" hexpand={true} vexpand={true} />,
                        <box class="background-panel-shadow" hexpand={true} vexpand={true} />,
                        <box class="background-panel-shadow" hexpand={true} vexpand={true} />,
                    );
                }}
            />
        </window>
    ));
}

export function BackgroundPanel() {
    return createRoot((dispose) => {
        return (
            <window
                name="background-panel"
                class="BackgroundPanel"
                // MUST be above the gdkmonitor prop
                layer={Astal.Layer.BACKGROUND}
                gdkmonitor={backgroundPanelMonitor}
                exclusivity={Astal.Exclusivity.EXCLUSIVE}
                anchor={
                    Astal.WindowAnchor.TOP |
                    Astal.WindowAnchor.RIGHT |
                    Astal.WindowAnchor.BOTTOM |
                    Astal.WindowAnchor.LEFT
                }
                vexpand={true}
                hexpand={true}
                application={app}
                onCloseRequest={(self) => {
                    dispose();
                    self.destroy();
                }}
                namespace={config.shellName}
                $={(self) => {
                    setupBackgroundPanelWorkspaceTracking(self);
                }}
            >
                <Gtk.Grid
                    hexpand={true}
                    vexpand={true}
                    marginTop={config.appearance.panelMargin}
                    marginEnd={config.appearance.panelMargin}
                    marginBottom={config.appearance.panelMargin}
                    marginStart={config.appearance.panelMargin}
                    rowSpacing={config.appearance.panelMargin}
                    columnSpacing={config.appearance.panelMargin}
                    columnHomogeneous={true}
                    rowHomogeneous={true}
                    $={(self) => {
                        layoutBackgroundPanels(
                            self,
                            config.news.enabled ? <News /> : <box />,
                            config.finance.enabled ? <Finance /> : <box />,
                            config.backgroundPanel.showClock ? <DisplayClock /> : <box />,
                            config.weather.enabled ? <WeatherVisualizer /> : <box />,
                        );
                    }}
                />
            </window>
        );
    });
}
