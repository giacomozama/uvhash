import { parseRGB } from "./utils/colors";
import GLib from "gi://GLib?version=2.0";
import AstalCava from "gi://AstalCava?version=0.1";
import { MusicVisualierMode } from "./media/types";
import { DockItemFeature, DockItemQuery } from "./dock/types";
import { loadMeteoAMWeatherData } from "./weather/weather_meteoam";

const SHELL_NAME = "contrapshell";
const SHELL_VERSION = "0.1";
const HOME = GLib.get_home_dir();
const CACHE_DIR = `${HOME}/.cache/${SHELL_NAME}`;
const RICE_HOME = GLib.getenv("RICE_HOME");
const ACCENT_1 = parseRGB(GLib.getenv("SHELL_ACCENT_1") ?? "0781e3");
const ACCENT_2 = parseRGB(GLib.getenv("SHELL_ACCENT_2") ?? "ff0077");
const IS_DGPU_MODE = GLib.getenv("GPU_CONF") == "gpu_perf.conf";

export const config = {
    shellName: SHELL_NAME,
    shellVersion: SHELL_VERSION,
    appearance: {
        wallpaperPath: `${RICE_HOME}/wallpaper.png`,
        accentsFilePath: `${HOME}/.config/hypr/accents.lua`,
        defaultWallpapersDir: "/mnt/evo/Wallpapers",
        backgroundPanelBorderRadius: 12,
        panelBorderRadius: 12,
        panelPadding: 8,
        panelMargin: 6,
    },
    audioControls: {
        enabled: true,
        audioSettingsCommand: "pavucontrol",
    },
    bar: {
        enabled: true,
        showShutdownButton: true,
        lockCommand: `/bin/bash -c "pidof hypridle && loginctl lock-session || (hypridle & loginctl lock-session)"`,
        logoutCommand: "hyprctl dispatch \"hl.dsp.exit()\"",
        suspendCommand: "systemctl suspend",
        restartCommand: "shutdown -r now",
        shutdownCommand: "shutdown now",
        showAppearanceSettingsButton: true,
    },
    backgroundPanel: {
        enabled: true,
        showClock: true,
        showOnMonitor: IS_DGPU_MODE ? "DP-2" : "DVI-D-1",
    },
    bluetooth: {
        enabled: true,
        bluetoothSettingsCommand: "blueman-manager",
    },
    barCalendar: {
        enabled: true,
    },
    caffeine: {
        enabled: true,
    },
    colors: {
        accent1: ACCENT_1,
        accent2: ACCENT_2,
    },
    dock: {
        enabled: true,
        showShortcuts: true,
        showSearchButton: true,
        items: (
            [
                { query: "firefox.desktop" },
                { query: "org.gnome.Geary.desktop" },
                { iconName: "multimedia-audio-player", feature: DockItemFeature.MpdClient, tooltip: "Music" },
                { iconName: "applications-games", feature: DockItemFeature.GameLauncher, tooltip: "Games" },
                { query: "kitty.desktop" },
                { query: "org.gnome.Nautilus.desktop" },
                { query: "idea.desktop" },
                { query: "code.desktop" },
                { query: "android-studio.desktop" },
                { query: "org.qbittorrent.qBittorrent.desktop" },
                { query: "discord.desktop" },
            ] as DockItemQuery[]
        ).concat(IS_DGPU_MODE ? [] : [{ query: "virt-manager.desktop" }]),
        itemSize: 52,
        iconSize: 36,
        searchIconSize: 28,
        launcherCommand: `walker`,
    },
    finance: {
        enabled: true,
        favorite_stocks: ["GOOGL"],
    },
    gameLaunchers: {
        enabled: true,
        steam: {
            enabled: true,
            steamappsDirs: ["/mnt/data/SteamLibrary/steamapps", `${HOME}/.local/share/Steam/steamapps`],
            excludePatterns: [/^Steam Linux Runtime/, /^Proton/, /^SteamVR$/, /^Steamworks Common Redistributables$/],
            libraryCacheDir: `${HOME}/.local/share/Steam/appcache/librarycache/`,
        },
        bottles: {
            enabled: true,
            libraryFilePath: `${HOME}/.local/share/bottles/library.yml`,
        },
    },
    gsConnect: {
        enabled: true,
    },
    mediaControls: {
        enabled: true,
        visualizerMode: MusicVisualierMode.Pills,
        visualizerBarSpacing: 2,
        visualizerBars: 50,
        visualizerFramerate: 60,
        visualizerInput: AstalCava.Input.PULSE,
    },
    monitors: {
        monitorOrder: IS_DGPU_MODE ? ["DP-1", "DP-2"] : ["HDMI-A-2", "DVI-D-1"],
    },
    mpd: {
        enabled: true,
        musicLibraryDir: `${HOME}/Music`,
        coversCacheDir: `${CACHE_DIR}/mpd/covers`,
    },
    network: {
        enabled: true,
        networkSettingsCommand: "nm-connection-editor",
    },
    news: {
        enabled: true,
        feeds: [
            { name: "NY Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
            {
                name: "Reuters",
                url: "https://rss-bridge.org/bridge01/?action=display&bridge=ReutersBridge&feed=home%2Ftopnews&format=Mrss",
            },
            {
                name: "Ars Technica",
                url: "https://feeds.arstechnica.com/arstechnica/index/",
            },
        ],
        picsCacheDir: `${CACHE_DIR}/news/pics`,
    },
    notifications: {
        enabled: true,
    },
    path: {
        bluetoothctl: "bluetoothctl",
        cacheDir: CACHE_DIR,
        storageDir: `${HOME}/.config/${SHELL_NAME}`,
        autoPaletteCli: `${RICE_HOME}/auto-palette-cli`,
        bottlesCli: "bottles-cli",
        magick: "magick",
        mpc: "mpc",
        python: `${SRC}/.venv/bin/python`,
    },
    resourceUsage: {
        enabled: true,
    },
    systemTray: {
        enabled: true,
    },
    trash: {
        enabled: true,
        checkIsFullCommand: `/bin/bash -c "[ \`find ${HOME}/.local/share/Trash/files -prune -empty 2>/dev/null\` ] && echo 0 || echo 1"`,
        checkIsFullInterval: 2000,
        openCommand: "nautilus trash:///",
        emptyCommand: "trash-empty -f",
    },
    updates: {
        enabled: true,
        checkUpdatesCommand: `/bin/bash -c "(checkupdates; yay -Qum 2>/dev/null); exit 0"`,
        checkUpdatesInterval: 300_000,
        launchCommand:
            'xdg-terminal-exec -- /bin/bash -c "yay -Syu; read -n 1 -s -r -p \\"Press any key to continue\\""',
    },
    weather: {
        enabled: true,
        dataProvider: loadMeteoAMWeatherData,
        updateInterval: 300_000,
    },
    workspaceSwitcher: {
        enabled: true,
    },
};

export default config;
