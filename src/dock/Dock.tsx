import { Astal, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { Accessor, createRoot, onCleanup } from "gnim";
import Trash from "../trash/Trash";
import { WorkspaceSwitcher } from "../workspace_switcher/WorkspaceSwitcher";
import { Monitor } from "../utils/monitors";
import { dockState } from "../dock/dock_state";
import { SearchDockItem } from "./SearchDockItem";
import { ButtonDockItem } from "./ButtonDockItem";
import config from "../config";

export function DockBackground(monitor: Monitor) {
    return (
        <window
            visible
            name={`dock-background-${monitor.connector}`}
            class="DockBackground"
            // MUST be above the gdkmonitor prop
            layer={Astal.Layer.BOTTOM}
            gdkmonitor={monitor.gdkMonitor}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={Astal.WindowAnchor.BOTTOM}
            application={app}
            marginBottom={config.appearance.panelMargin}
            namespace={config.shellName}
            height_request={config.dock.itemSize + config.appearance.panelPadding * 2}
        />
    );
}

export function DockShadow(monitor: Monitor) {
    return (
        <window
            visible
            name={`dock-shadow-${monitor.connector}`}
            class="DockShadow"
            // MUST be above the gdkmonitor prop
            layer={Astal.Layer.BOTTOM}
            gdkmonitor={monitor.gdkMonitor}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={Astal.WindowAnchor.BOTTOM}
            application={app}
            namespace={`${config.shellName}-overlay`}
            height_request={config.dock.itemSize + config.appearance.panelPadding * 2 + config.appearance.panelMargin * 2}
        />
    );
}

export function DockForeground(monitor: Monitor) {
    return createRoot((dispose) => (
        <window
            visible
            name={`dock-foreground-${monitor.connector}`}
            class="DockForeground"
            // MUST be above the gdkmonitor prop
            layer={Astal.Layer.BOTTOM}
            gdkmonitor={monitor.gdkMonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={Astal.WindowAnchor.BOTTOM}
            application={app}
            marginBottom={config.appearance.panelMargin}
            onCloseRequest={(self) => {
                dispose();
                self.destroy();
            }}
            namespace={`${config.shellName}-overlay`}
            $={(self) => {
                const surface = self.get_surface();
                const sourceId = surface?.connect("notify::width", () => {
                    app.get_window(`dock-background-${monitor.connector}`)?.set_property(
                        "default-width",
                        surface.width
                    );
                    app.get_window(`dock-shadow-${monitor.connector}`)?.set_property(
                        "default-width",
                        surface.width + config.appearance.panelMargin * 2
                    );
                })!;
                onCleanup(() => self.disconnect(sourceId));
            }}
        >
            <box
                layoutManager={new Gtk.BinLayout()}
                height_request={config.dock.itemSize + config.appearance.panelPadding * 2}
            >
                <box cssName="main" hexpand={true} vexpand={true} spacing={6}>
                    {config.dock.showShortcuts &&
                        dockState().dockItems.map((item) => <ButtonDockItem item={item} monitor={monitor} />)}
                    {config.trash.enabled && <Trash />}
                    {config.workspaceSwitcher.enabled && <WorkspaceSwitcher monitor={monitor} />}
                    {config.dock.showSearchButton && <SearchDockItem />}
                </box>
                <box class="dock-gloss" canFocus={false} canTarget={false} />
            </box>
        </window>
    ));
}
