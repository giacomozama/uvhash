import app from "ags/gtk4/app";
import { Astal, Gtk } from "ags/gtk4";
import { Accessor } from "gnim";
import { firstNonFullscreenMonitor } from "../compositor/compositor";
import MediaControls from "../media/MediaControls";
import AudioControls from "../audio/AudioControls";
import SystemTray from "../system_tray/SystemTray";
import CaffeineBarButton from "../caffeine/CaffeineBarButton";
import NotificationsBarButton from "../notifications/NotificationsBarButton";
import BluetoothBarButton from "../bluetooth/BluetoothBarButton";
import CalendarBarButton from "../calendar/Calendar";
import UpdatesBarButton from "../updates/Updates";
import GSConnectIndicator from "../gsconnect/GSConnectIndicator";
import NetworkBarButton from "../network/NetworkBarButton";
import { ResourceUsageDash } from "../resource_usage/ResourceUsage";
import { BarDivider } from "./BarDivider";
import { ShutdownBarButton } from "../shutdown/ShutdownBarButton";
import { AppearanceSettingsBarButton } from "../appearance_settings/AppearanceSettingsBarButton";
import config from "../config";
import { storage } from "../storage/storage_state";

function BarContent() {
    return (
        <centerbox
            cssName="main"
            heightRequest={32}
            valign={Gtk.Align.CENTER}
            hexpand={true}
            hexpandSet={true}
            overflow={Gtk.Overflow.HIDDEN}
        >
            <box $type="start" hexpandSet={true}>
                {config.bar.showShutdownButton && <ShutdownBarButton />}
                {config.bar.showShutdownButton && <BarDivider />}
                {config.bar.showAppearanceSettingsButton && <AppearanceSettingsBarButton />}
                {config.bar.showAppearanceSettingsButton && <BarDivider />}
                {config.resourceUsage.enabled && <ResourceUsageDash />}
                {config.resourceUsage.enabled && <BarDivider />}
                {config.updates.enabled && <UpdatesBarButton />}
                {config.updates.enabled && <BarDivider />}
            </box>
            {config.mediaControls.enabled && (
                <box $type="center" halign={Gtk.Align.CENTER}>
                    <BarDivider />
                    <MediaControls />
                    <BarDivider />
                </box>
            )}
            <box $type="end" hexpandSet={true}>
                {config.systemTray.enabled && <SystemTray />}
                <BarDivider />
                <box class="bar-group" overflow={Gtk.Overflow.HIDDEN}>
                    {config.bluetooth.enabled && <BluetoothBarButton />}
                    {config.network.enabled && <NetworkBarButton />}
                    {config.caffeine.enabled && <CaffeineBarButton />}
                    {config.gsConnect.enabled && <GSConnectIndicator />}
                </box>
                {config.audioControls.enabled && <BarDivider />}
                {config.audioControls.enabled && <AudioControls />}
                {config.barCalendar.enabled && <BarDivider />}
                {config.barCalendar.enabled && <CalendarBarButton />}
                {config.notifications.enabled && <BarDivider />}
                {config.notifications.enabled && <NotificationsBarButton />}
            </box>
        </centerbox>
    );
}

export function BarScrim() {
    if (!storage.peek().useScrim) return;

    <window
        visible
        name="bar-scrim"
        class="BarScrim"
        // MUST be above the gdkmonitor prop
        layer={Astal.Layer.BACKGROUND}
        gdkmonitor={firstNonFullscreenMonitor}
        exclusivity={Astal.Exclusivity.IGNORE}
        anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
        application={app}
        heightRequest={72}
        namespace={`${config.shellName}-scrim`}
    />;
}

export function BarShadow() {
    return (
        <window
            visible
            name="bar-shadow"
            class="BarShadow"
            // MUST be above the gdkmonitor prop
            layer={Astal.Layer.BOTTOM}
            gdkmonitor={firstNonFullscreenMonitor}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
            application={app}
            heightRequest={52}
            namespace={`${config.shellName}-overlay`}
        />
    );
}

export function BarBackground() {
    return (
        <window
            visible
            name="bar-background"
            class="BarBackground"
            // MUST be above the gdkmonitor prop
            layer={Astal.Layer.BOTTOM}
            gdkmonitor={firstNonFullscreenMonitor}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
            application={app}
            heightRequest={40}
            marginTop={config.appearance.panelMargin}
            marginRight={config.appearance.panelMargin}
            marginLeft={config.appearance.panelMargin}
            namespace={config.shellName}
        />
    );
}

export function BarForeground() {
    return (
        <window
            visible
            name="bar-foreground"
            class="BarForeground"
            // MUST be above the gdkmonitor prop
            layer={Astal.Layer.BOTTOM}
            gdkmonitor={firstNonFullscreenMonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
            application={app}
            marginTop={config.appearance.panelMargin}
            marginRight={config.appearance.panelMargin}
            marginLeft={config.appearance.panelMargin}
            namespace={`${config.shellName}-overlay`}
        >
            <box layoutManager={new Gtk.BinLayout()}>
                <box class="bar-shadow" canFocus={false} canTarget={false} />
                <BarContent />
                <box class="bar-gloss" canFocus={false} canTarget={false} />
            </box>
        </window>
    );
}
