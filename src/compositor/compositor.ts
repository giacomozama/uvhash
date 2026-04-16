import GLib from "gi://GLib?version=2.0";
import { CompositorDelegate, WorkspaceDelegate } from "./base";
import { HyprlandCompositorDelegate } from "./hyprland";
import GioUnix from "gi://GioUnix?version=2.0";
import { Gdk, Gtk } from "ags/gtk4";
import GObject from "gnim/gobject";

const delegate: CompositorDelegate = (() => {
    switch (GLib.getenv("XDG_SESSION_DESKTOP")) {
        case "Hyprland":
            return new HyprlandCompositorDelegate();
        default:
            throw new Error("Unsupported desktop environment");
    }
})();

export function closeFocusedApp() {
    return delegate.closeFocusedApp();
}

export function isAppRunning(app: GioUnix.DesktopAppInfo) {
    return delegate.isAppRunning(app);
}

export function findAppClient(app: GioUnix.DesktopAppInfo) {
    return delegate.findAppClient(app);
}

export function launchOrFocus(app: GioUnix.DesktopAppInfo) {
    return delegate.launchOrFocus(app);
}

export function launchInHomeDir(app: GioUnix.DesktopAppInfo) {
    return delegate.launchInHomeDir(app);
}

export function setupBackgroundPanelWorkspaceTracking(window: Gtk.Window) {
    return delegate.setupBackgroundPanelWorkspaceTracking(window);
}

export function setupWorkspacesGrid(monitorId: string, onWorkspacesChanged: (delegates: WorkspaceDelegate[]) => void) {
    return delegate.setupWorkspacesGrid(monitorId, onWorkspacesChanged);
}

export const firstNonFullscreenMonitor = delegate.firstNonFullscreenMonitor;

export const backgroundPanelMonitor = delegate.backgroundPanelMonitor;

export function rememberForEachMonitor(factory: (monitor: Gdk.Monitor) => GObject.Object) {
    return delegate.rememberForEachMonitor(factory);
}
