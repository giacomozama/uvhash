import AstalHyprland from "gi://AstalHyprland?version=0.1";
import GioUnix from "gi://GioUnix?version=2.0";
import { createBinding, createComputed, createEffect, onCleanup } from "gnim";
import { Gdk, Gtk } from "ags/gtk4";
import config from "../config";
import GObject from "gnim/gobject";
import app from "ags/gtk4/app";
import { CompositorDelegate, WorkspaceDelegate } from "./base";

export class HyprlandCompositorDelegate extends CompositorDelegate {
    private hyprland = AstalHyprland.get_default();
    private gdkMonitorsBinding = createBinding(app, "monitors");
    private hyprlandMonitorsBinding = createBinding(this.hyprland, "monitors");

    private getMonitorCursorIsCurrentlyOn() {
        const position = this.hyprland.get_cursor_position();
        for (const monitor of this.hyprland.get_monitors()) {
            if (
                position.x >= monitor.x &&
                position.x < monitor.x + monitor.width &&
                position.y >= monitor.y &&
                position.y < monitor.y + monitor.height
            ) {
                return monitor;
            }
        }
    }

    closeFocusedApp() {
        this.hyprland.get_focused_client().kill();
    }

    isAppRunning(app: GioUnix.DesktopAppInfo) {
        return createBinding(this.hyprland, "clients").as(() => this.findAppClient(app) !== null);
    }

    findAppClient(app: GioUnix.DesktopAppInfo) {
        const clients = this.hyprland.clients;
        for (const client of clients) {
            if (client.initialClass === app.get_startup_wm_class()) return client;
            const appId = app?.get_id();
            if (!appId) continue;
            if (client.initialClass === appId?.slice(0, appId.length - 8)) return client;
        }
        return null;
    }

    launchOrFocus(app: GioUnix.DesktopAppInfo) {
        const client = this.findAppClient(app);

        if (!client) {
            super.launchInHomeDir(app);
            return true;
        }

        const monitor = this.getMonitorCursorIsCurrentlyOn();
        if (monitor) {
            client.move_to(monitor.activeWorkspace);
        }

        client.focus();
        return false;
    }

    setupBackgroundPanelWorkspaceTracking(window: Gtk.Window) {
        const hyprMonitor = this.hyprland.get_monitor_by_name(config.backgroundPanel.showOnMonitor);
        if (!hyprMonitor) return;

        let activeWorkspace: AstalHyprland.Workspace | undefined;
        let clientsConnId: number | undefined;

        function onActiveWorkspaceChanged() {
            if (clientsConnId) {
                hyprMonitor?.disconnect(clientsConnId);
                activeWorkspace = undefined;
                clientsConnId = undefined;
            }

            activeWorkspace = hyprMonitor?.activeWorkspace;
            if (!activeWorkspace) return;

            function onClientsChanged() {
                if (activeWorkspace?.get_clients().length) {
                    window?.hide();
                } else {
                    window?.show();
                }
            }

            clientsConnId = activeWorkspace?.connect("notify::clients", onClientsChanged);
            onClientsChanged();
        }

        const activeWorkspaceConnId = hyprMonitor.connect("notify::active-workspace", onActiveWorkspaceChanged);
        onCleanup(() => this.hyprland.disconnect(activeWorkspaceConnId));

        onActiveWorkspaceChanged();
    }

    setupWorkspacesGrid(monitorId: string, onWorkspacesChanged: (delegates: WorkspaceDelegate[]) => void) {
        createEffect(() => {
            const monitor = createBinding(this.hyprland, "monitors").as((ms) => ms.find((m) => m.name === monitorId))();
            if (!monitor) return;
            const activeWorkspace = createBinding(monitor, "activeWorkspace");
            const workspaces = createBinding(this.hyprland, "workspaces")().filter((w) => w.monitor.id === monitor.id);

            workspaces.sort((a, b) => a.id - b.id);
            const delegates = workspaces.map((workspace) => {
                const workspaceClients = createBinding(workspace, "clients");
                return {
                    focusWorkspace: () => workspace.focus(),
                    moveFocusedClientToWorkspace: () => this.hyprland.get_focused_client().move_to(workspace),
                    clientCount: workspaceClients.as((c) => c.length),
                    tooltip: workspaceClients.as((cc) => cc.map((c) => c.initialTitle).join("\n")),
                    isActiveWorkspace: activeWorkspace.as((w) => w.id === workspace.id),
                };
            });

            onWorkspacesChanged(delegates);
        });
    }

    rememberForEachMonitor(factory: (monitor: Gdk.Monitor) => GObject.Object) {
        const existing: { [key: string]: GObject.Object | undefined } = {};

        createEffect(() => {
            const hyprlandMonitors = this.hyprlandMonitorsBinding();
            const gdkMonitors = this.gdkMonitorsBinding();

            for (const hyprlandMonitor of hyprlandMonitors) {
                if (!hyprlandMonitor.name || existing[hyprlandMonitor.name]) continue;

                const gdkMonitor = gdkMonitors.find((m) => m.connector === hyprlandMonitor.name);
                if (!gdkMonitor) continue;

                existing[hyprlandMonitor.name] = factory(gdkMonitor);
            }

            for (const key of Object.keys(existing)) {
                if (gdkMonitors.some((m) => m.connector === key)) continue;
                (existing[key] as Gtk.Window).close();
                delete existing[key];
            }
        });
    }

    firstNonFullscreenMonitor = createComputed(() => {
        const monitorOrder = config.monitors.monitorOrder;

        const gdkMonitors = this.gdkMonitorsBinding();
        gdkMonitors.sort((a, b) => monitorOrder.indexOf(a.connector) - monitorOrder.indexOf(b.connector));

        // track Hyprland monitors
        this.hyprlandMonitorsBinding();

        let result: Gdk.Monitor | undefined;

        for (const monitor of gdkMonitors) {
            if (!monitor.connector) {
                createBinding(monitor, "connector")();
                continue;
            }

            const hyprMonitor = this.hyprland.get_monitor_by_name(monitor.connector);
            if (!hyprMonitor) continue;

            const clients = createBinding(hyprMonitor, "activeWorkspace", "clients")();

            for (const client of clients) {
                // avoid breaking after finding the monitor (for tracking purposes)
                if (createBinding(client, "fullscreen")() === AstalHyprland.Fullscreen.FULLSCREEN && !result) {
                    result = monitor;
                }
            }

            if (!clients.some((c) => c.fullscreen === AstalHyprland.Fullscreen.FULLSCREEN)) {
                return monitor;
            }
        }

        return result ?? gdkMonitors[0];
    });
}
