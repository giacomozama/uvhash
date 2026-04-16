import { Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import GioUnix from "gi://GioUnix?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { Accessor, createBinding, createComputed } from "gnim";
import GObject from "gnim/gobject";
import config from "../config";

export type WorkspaceDelegate = {
    focusWorkspace: () => void;
    moveFocusedClientToWorkspace: () => void;
    clientCount: Accessor<number>;
    tooltip: Accessor<string>;
    isActiveWorkspace: Accessor<boolean>;
};

export abstract class CompositorDelegate implements CompositorDelegate {
    abstract closeFocusedApp(): void;
    abstract isAppRunning(app: GioUnix.DesktopAppInfo): Accessor<boolean>;
    abstract findAppClient(app: GioUnix.DesktopAppInfo): AstalHyprland.Client | null;
    abstract launchOrFocus(app: GioUnix.DesktopAppInfo): boolean;
    abstract setupBackgroundPanelWorkspaceTracking(window: Gtk.Window): void;
    abstract setupWorkspacesGrid(
        monitorId: string,
        onWorkspacesChanged: (delegates: WorkspaceDelegate[]) => void,
    ): void;
    abstract rememberForEachMonitor(factory: (monitor: Gdk.Monitor) => GObject.Object): void;
    abstract firstNonFullscreenMonitor: Accessor<Gdk.Monitor>;

    launchInHomeDir(app: GioUnix.DesktopAppInfo) {
        const curDir = GLib.get_current_dir();
        GLib.chdir(GLib.get_home_dir());
        app.launch([], null);
        GLib.chdir(curDir);
    }

    backgroundPanelMonitor: Accessor<Gdk.Monitor> = createComputed(() => {
        const monitors = createBinding(app, "monitors")();
        for (const monitor of monitors) {
            if (createBinding(monitor, "connector")() === config.backgroundPanel.showOnMonitor) return monitor;
        }
        return monitors[0];
    });
}
