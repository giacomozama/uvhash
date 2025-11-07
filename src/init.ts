import style from "./style.scss";
import { DockBackground, DockForeground } from "./dock/Dock";
import { rgbToComponents } from "./utils/colors";
import config from "./config";
import { rememberForEachMonitor } from "./utils/monitors";
import app from "ags/gtk4/app";
import { VolumeChangeWindow } from "./audio/VolumeChangeWindow";
import { setupBackgroundVisualizer } from "./background_visualizer/background_visualizer_state";
import { NewNotificationWindow } from "./notifications/NewNotificationWindow";
import { BarBackground, BarForeground } from "./bar/Bar";

function getAppCSS() {
    const cssVariablesChunk = `
    :root {
        --shell-accent-1-rgb: ${rgbToComponents(config.colors.accent1)};
        --shell-accent-2-rgb: ${rgbToComponents(config.colors.accent2)};
    }
    `;
    return `${cssVariablesChunk}\n${style}`;
}

export function initApp() {
    app.start({
        instanceName: config.shellName,
        css: getAppCSS(),
        icons: `${SRC}/icons`,
        iconTheme: "Papirus-Dark",
        main() {
            setupBackgroundVisualizer();
            BarBackground();
            BarForeground();
            VolumeChangeWindow();
            NewNotificationWindow();
            rememberForEachMonitor(DockBackground);
            rememberForEachMonitor(DockForeground);
        },
    });
}
