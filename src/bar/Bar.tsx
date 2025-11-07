import app from "ags/gtk4/app";
import { Astal, Gtk } from "ags/gtk4";
import { Accessor } from "gnim";
import { firstNonFullscreenMonitor } from "../utils/monitors";
import MediaControls from "../media/MediaControls";
import AudioControls from "../audio/AudioControls";
import SystemTray from "../system_tray/SystemTray";
import CaffeineBarButton from "../caffeine/CaffeineBarButton";
import NotificationsBarButton from "../notifications/NotificationsBarButton";
import { WeatherButton } from "../weather/Weather";
import BluetoothBarButton from "../bluetooth/BluetoothBarButton";
import CalendarBarButton from "../calendar/CalendarBarButton";
import UpdatesBarButton from "../updates/UpdatesBarButton";
import GSConnectIndicator from "../gsconnect/GSConnectIndicator";
import NetworkBarButton from "../network/NetworkBarButton";
import { ResourceUsageDash } from "../resource_usage/ResourceUsage";
import { BarDivider } from "./BarDivider";
import { ShutdownBarButton } from "../shutdown/ShutdownBarButton";
import { AppearanceSettingsBarButton } from "../appearance_settings/AppearanceSettingsBarButton";
import config from "../config";

export function BarBackground() {
    return (
        <window
            visible
            name="bar-background"
            class="BarBackground"
            // MUST be above the gdkmonitor prop
            layer={Astal.Layer.TOP}
            gdkmonitor={firstNonFullscreenMonitor.as((m) => m.gdkMonitor)}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
            application={app}
            heightRequest={48}
            namespace={config.shellName}
        >
            <box cssName={"main"}>
                <box cssName="main-inner" overflow={Gtk.Overflow.HIDDEN} hexpand={true} />
            </box>
        </window>
    );
}

export function BarForeground() {
    return (
        <window
            visible
            name="bar-foreground"
            class="BarForeground"
            // MUST be above the gdkmonitor prop
            layer={Astal.Layer.TOP}
            gdkmonitor={firstNonFullscreenMonitor.as((m) => m.gdkMonitor)}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
            application={app}
            namespace={`${config.shellName}-overlay`}
        >
            {/* animationSpeed={0} cornerRadius={12} thickness={1.4} */}
            <box cssName={"main"}>
                <box cssName="main-inner" overflow={Gtk.Overflow.HIDDEN} layoutManager={new Gtk.BinLayout()}>
                    <centerbox heightRequest={32} valign={Gtk.Align.CENTER} hexpand={true} class={"BarContent"}>
                        <box
                            $type="start"
                            // spacing={4}
                        >
                            <ShutdownBarButton />
                            <BarDivider />
                            <AppearanceSettingsBarButton />
                            <BarDivider />
                            <ResourceUsageDash />
                            <BarDivider />
                            <WeatherButton />
                            <BarDivider />
                            <UpdatesBarButton />
                            <BarDivider />
                        </box>
                        <box $type="center" halign={Gtk.Align.CENTER}>
                            <BarDivider />
                            <MediaControls />
                            <BarDivider />
                        </box>
                        <box
                            $type="end"
                            // spacing={4}
                        >
                            <SystemTray />
                            <BarDivider />
                            <box class="bar-group" overflow={Gtk.Overflow.HIDDEN}>
                                <BluetoothBarButton />
                                <NetworkBarButton />
                                <CaffeineBarButton />
                                <GSConnectIndicator />
                                {/* <EyeCandyBarButton /> */}
                            </box>
                            <BarDivider />
                            <AudioControls />
                            <BarDivider />
                            <CalendarBarButton />
                            <BarDivider />
                            <NotificationsBarButton />
                        </box>
                    </centerbox>
                    <box class="bar-gloss" canFocus={false} canTarget={false} />
                </box>
            </box>
        </window>
    );
}
