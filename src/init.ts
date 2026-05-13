import style from "./style.scss";
import { DockBackground, DockForeground, DockShadow } from "./dock/Dock";
import { rgbToComponents } from "./utils/colors";
import config from "./config";
import { rememberForEachMonitor } from "./compositor/compositor";
import app from "ags/gtk4/app";
import { VolumeChangeWindow } from "./audio/VolumeChangeWindow";
import { NewNotificationWindow } from "./notifications/NewNotificationWindow";
import { BarBackground, BarForeground, BarScrim, BarShadow } from "./bar/Bar";
import { AudioControlsPopoverWindow } from "./audio/AudioControls";
import { BluetoothPopoverWindow } from "./bluetooth/BluetoothPopover";
import { NetworkPopoverWindow } from "./network/NetworkPopover";
import { CalendarPopoverWindow } from "./calendar/Calendar";
import { MediaControlsPopoverWindow } from "./media/MediaControls";
import { NotificationsBarPopoverWindow } from "./notifications/NotificationsPopover";
import { UpdatesPopoverWindow } from "./updates/Updates";
import MusicLibraryPopoverWindow from "./mpd/MusicLibraryPopover";
import { CombinedGameLauncherPopoverWindow } from "./game_launcher/GameLauncherPopover";
import { BackgroundPanel, BackgroundPanelShadow } from "./background_panel/BackgroundPanel";
import { PopoverOutsideClickInterceptor } from "./misc/GlassyPopover";
import { storage } from "./storage/storage_state";
import { Gtk } from "ags/gtk4";
import { audioState } from "./audio/audio_state";
import { bluetoothState } from "./bluetooth/bluetooth_state";
import { networkState } from "./network/network_state";
import { mediaState } from "./media/media_state";
import { notificationsState } from "./notifications/notifications_state";
import { updatesState } from "./updates/updates_state";
import dockState from "./dock/dock_state";
import { mpdState } from "./mpd/mpd_state";
import { autoPaletteState } from "./auto_palette/auto_palette_state";
import { caffeineState } from "./caffeine/caffeine_state";
import { financeState } from "./finance/finance_state";
import { newsState } from "./news/news_state";
import { weatherState } from "./weather/weather_state";
import { appearanceSettingsState } from "./appearance_settings/appearance_settings_state";
import { createRoot } from "gnim";

function getAppCSS() {
    const cssVariablesChunk = `
    :root {
        --shell-accent-1-rgb: ${rgbToComponents(config.colors.accent1)};
        --shell-accent-2-rgb: ${rgbToComponents(config.colors.accent2)};
        --panel-border-radius: ${config.appearance.panelBorderRadius}px;
        --background-panel-border-radius: ${config.appearance.backgroundPanelBorderRadius}px;
        --panel-padding: ${config.appearance.panelPadding}px;
        --panel-margin: ${config.appearance.panelMargin}px;
        --glassy-bg-color: ${storage.peek().useDarkPanels ? "rgba(10, 10, 10, 0.4)" : "rgba(255, 255, 255, 0.05)"};
        --glassy-box-shadow: ${
            storage.peek().useDarkPanels
                ? "inset 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 0 3px 1px rgba(255, 255, 255, 0.15)"
                : "inset 0 0 1px 3px rgba(255, 255, 255, 0.04), inset 0 0 0 1px rgba(255, 255, 255, 0.11)"
        };
    }
    `;
    return `${cssVariablesChunk}\n${style}`;
}

function doOpenAllWindows() {
    if (app.windows.length) {
        print("some windows open. skipping");
        console.log(app.windows);
        return;
    }

    if (config.bar.enabled) {
        if (config.audioControls.enabled) AudioControlsPopoverWindow();
        if (config.bluetooth.enabled) BluetoothPopoverWindow();
        if (config.network.enabled) NetworkPopoverWindow();
        if (config.barCalendar.enabled) CalendarPopoverWindow();
        if (config.mediaControls.enabled) MediaControlsPopoverWindow();
        if (config.notifications.enabled) NotificationsBarPopoverWindow();
        if (config.updates.enabled) UpdatesPopoverWindow();
    }

    if (config.dock.enabled) {
        if (config.gameLaunchers.enabled) CombinedGameLauncherPopoverWindow();
        if (config.mpd.enabled) MusicLibraryPopoverWindow();
    }

    if (config.backgroundPanel.enabled) {
        BackgroundPanelShadow();
        BackgroundPanel();
    }

    if (config.bar.enabled) {
        BarScrim();
        BarShadow();
        BarBackground();
        rememberForEachMonitor(PopoverOutsideClickInterceptor);
        BarForeground();
    }

    if (config.notifications.enabled) {
        NewNotificationWindow();
    }

    if (config.audioControls.enabled) {
        VolumeChangeWindow();
    }

    if (config.dock.enabled) {
        rememberForEachMonitor(DockShadow);
        rememberForEachMonitor(DockBackground);
        rememberForEachMonitor(DockForeground);
    }
}

let cleanupWindows: (() => void) | undefined;

function openAllWindows() {
    createRoot((dispose) => {
        cleanupWindows = dispose;
        doOpenAllWindows();
    });
}

function closeAllWindows() {
    for (const window of app.windows) {
        window.close();
        window.set_application(null);
    }
    cleanupWindows?.();
}

export function initApp() {
    app.start({
        instanceName: config.shellName,
        css: getAppCSS(),
        icons: `${SRC}/resources/icons`,
        iconTheme: "Papirus-Dark",
        requestHandler(argv: string[], response: (response: string) => void) {
            switch (argv[0]) {
                case "show":
                    openAllWindows();
                    response("ok");
                    break;
                case "hide":
                    closeAllWindows();
                    response("ok");
                    break;
                default:
                    response("unknown command");
                    break;
            }
        },
        main() {
            autoPaletteState();

            if (config.bar.enabled) {
                caffeineState();
                appearanceSettingsState();
            }

            if (config.audioControls.enabled) audioState();
            if (config.bluetooth.enabled) bluetoothState();
            if (config.network.enabled) networkState();
            if (config.mediaControls.enabled) mediaState();
            if (config.notifications.enabled) notificationsState();
            if (config.updates.enabled) updatesState();

            if (config.dock.enabled) dockState();
            if (config.mpd.enabled) mpdState();
            if (config.weather.enabled) weatherState();

            if (config.news.enabled) newsState();
            if (config.finance.enabled) financeState();

            openAllWindows();
        },
    });
}
