import { Astal, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { Accessor, createBinding, createRoot, createState, onCleanup } from "gnim";
import TrashDockItem from "../trash/TrashDockItem";
import { WorkspaceSwitcher } from "../workspace_switcher/WorkspaceSwitcher";
import { Monitor } from "../utils/monitors";
import { dockItems } from "../dock/dock_state";
import { SearchDockItem } from "./SearchDockItem";
import { ButtonDockItem } from "./ButtonDockItem";
import config from "../config";
import { walkChildren } from "../utils/gtk";

export function DockBackground(monitor: Monitor) {
    return createRoot((dispose) => (
        <window
            visible
            name={`dock-${monitor.connector}-background`}
            class="DockBackground"
            // MUST be above the gdkmonitor prop
            layer={Astal.Layer.TOP}
            gdkmonitor={monitor.gdkMonitor}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={Astal.WindowAnchor.BOTTOM}
            application={app}
            onCloseRequest={dispose}
            namespace={config.shellName}
        >
            <box valign={Gtk.Align.END}>
                {/* animationSpeed={0} cornerRadius={12} thickness={1.4} */}
                <box cssName="main">
                    <box cssName="main-inner" layoutManager={new Gtk.BinLayout()} hexpand={true} />
                    {/* set the height of the dock */}
                    <box height_request={config.dock.itemSize + 16} />
                </box>
            </box>
        </window>
    ));
}

export function DockForeground(monitor: Monitor) {
    return createRoot((dispose) => (
        <window
            visible
            name={`dock-${monitor.connector}-foreground`}
            class="DockForeground"
            // MUST be above the gdkmonitor prop
            layer={Astal.Layer.TOP}
            gdkmonitor={monitor.gdkMonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={Astal.WindowAnchor.BOTTOM}
            application={app}
            onCloseRequest={dispose}
            namespace={config.shellName + "-overlay"}
            $={(self) => {
                const surface = self.get_surface();
                const sourceId = surface?.connect("notify::width", () =>
                    app.get_window(`dock-${monitor.connector}-background`)?.set_property("default-width", surface.width)
                )!;
                onCleanup(() => self.disconnect(sourceId));
            }}
        >
            <box valign={Gtk.Align.END}>
                {/* animationSpeed={0} cornerRadius={12} thickness={1.4} */}
                <box cssName="main">
                    <box cssName="main-inner" layoutManager={new Gtk.BinLayout()}>
                        <box hexpand={true} vexpand={true} spacing={6}>
                            {dockItems.map((item) => (
                                <ButtonDockItem item={item} monitor={monitor} />
                            ))}
                            {<TrashDockItem />}
                            {<WorkspaceSwitcher monitor={monitor} />}
                            {<SearchDockItem />}
                        </box>
                        <box class="dock-gloss" canFocus={false} canTarget={false} />
                    </box>
                    {/* set the height of the dock */}
                    <box height_request={config.dock.itemSize + 16} />
                </box>
            </box>
        </window>
    ));
}
