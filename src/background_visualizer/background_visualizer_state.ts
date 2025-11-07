import app from "ags/gtk4/app";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import config from "../config";
import { BackgroundVisualizer } from "./BackgroundVisualizer";

export function setupBackgroundVisualizer() {
    const hyprland = AstalHyprland.get_default();

    const hyprMonitor = hyprland.get_monitor_by_name(config.backgroundVisualizer.showOnMonitor);
    if (!hyprMonitor) return;

    const backgroundWindow = BackgroundVisualizer();
    if (!backgroundWindow) return;

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
            const visualizerWindow = app.get_window("background-visualizer");
            if (activeWorkspace?.get_clients().length) {
                visualizerWindow?.hide();
            } else {
                visualizerWindow?.show();
            }
        }

        clientsConnId = activeWorkspace?.connect("notify::clients", onClientsChanged);
        onClientsChanged();
    }

    hyprMonitor.connect("notify::active-workspace", onActiveWorkspaceChanged);
    onActiveWorkspaceChanged();
}
