import { exec } from "ags/process";
import { parseRGB } from "./utils/colors";
import GLib from "gi://GLib?version=2.0";
import AstalCava from "gi://AstalCava?version=0.1";
import { MusicVisualierMode } from "./media/types";
import { DockItemFeature, DockItemQuery } from "./dock/types";
import { loadMeteoAMWeatherData } from "./weather/weather_meteoam";

const SHELL_NAME = "uvhash";
const SHELL_VERSION = "0.1";
const HOME = GLib.getenv("HOME");
const CACHE_DIR = `${HOME}/.cache/${SHELL_NAME}`;
const RICE_HOME = GLib.getenv("RICE_HOME");
const username = GLib.getenv("USER")!;
const hostname = exec("cat /etc/hostname")!;
const ACCENT_1 = parseRGB(GLib.getenv("SHELL_ACCENT_1") ?? "0781e3");
const ACCENT_2 = parseRGB(GLib.getenv("SHELL_ACCENT_2") ?? "ff0077");

export const config = {
    shellName: SHELL_NAME,
    shellVersion: SHELL_VERSION,
    appearance: {
        wallpaperPath: `${RICE_HOME}/wallpaper.png`,
        wallpaperMaskPath: `${RICE_HOME}/wallpaper_mask.png`,
        accentsFilePath: `${HOME}/.config/hypr/accents.conf`,
        defaultWallpapersDir: "/mnt/qvo/Misc/aenami/bulk/upscaled/png",
    },
    audioControls: {
        audioSettingsCommand: "pavucontrol",
    },
    backgroundVisualizer: {
        showOnMonitor: "HDMI-A-1",
    },
    bluetooth: {
        bluetoothSettingsCommand: "blueman-manager",
    },
    caffeine: {
        checkCommand: `/bin/bash -c "[ \\"$(pidof hypridle)\\" = \\"\\" ] && echo 1 || echo 0"`,
        toggleCommand: `/bin/bash -c "[ \\"$(pidof hypridle)\\" = \\"\\" ] && hyprctl dispatch exec hypridle || killall hypridle"`,
        pollingInterval: 1000,
    },
    colors: {
        accent1: ACCENT_1,
        accent2: ACCENT_2,
    },
    dock: {
        items: [
            { query: "firefox" },
            { query: "geary" },
            { iconName: "multimedia-audio-player", feature: DockItemFeature.MpdClient, tooltip: "Music" },
            { iconName: "applications-games", feature: DockItemFeature.GameLauncher, tooltip: "Games" },
            { query: "kitty" },
            { query: "nautilus" },
            { query: "idea community" },
            { query: "code" },
            { query: "android-studio" },
            { query: "qbittorrent" },
            // { query: "bottles", feature: DockItemFeature.BottlesLauncher },
            // { query: "steam", feature: DockItemFeature.SteamLauncher },
            { query: "/usr/bin/discord" },
        ] as DockItemQuery[],
        itemSize: 52,
        iconSize: 36,
        searchIconSize: 28,
        launcherCommand: `walker`,
        trash: {
            checkIsFullCommand: `/bin/bash -c "[ \`find ${HOME}/.local/share/Trash/files -prune -empty 2>/dev/null\` ] && echo 0 || echo 1"`,
            checkIsFullInterval: 2000,
            openCommand: "nautilus trash:///",
            emptyCommand: "trash-empty -f",
        },
    },
    gameLaunchers: {
        steam: {
            steamappsDirs: ["/mnt/data/SteamLibrary/steamapps", `${HOME}/.local/share/Steam/steamapps`],
            excludePatterns: [/^Steam Linux Runtime/, /^Proton/, /^SteamVR$/, /^Steamworks Common Redistributables$/],
            libraryCacheDir: `${HOME}/.local/share/Steam/appcache/librarycache/`,
        },
        bottles: {
            libraryFilePath: `${HOME}/.local/share/bottles/library.yml`,
        },
    },
    mediaControls: {
        visualizerMode: MusicVisualierMode.Pills,
        visualizerBarSpacing: 2,
        configureCava: (cava: AstalCava.Cava) => {
            cava.set_bars(50);
            cava.set_framerate(60);
            cava.set_input(AstalCava.Input.PULSE);
        },
    },
    monitors: {
        monitorOrder: ["DP-1", "HDMI-A-1"],
    },
    mpd: {
        musicLibraryDir: `${HOME}/Music`,
        coversCacheDir: `${CACHE_DIR}/mpd/covers`,
    },
    network: {
        networkSettingsCommand: "nm-connection-editor",
    },
    news: {
        feeds: [
            { name: "NY Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
            {
                name: "Reuters",
                url: "https://rss-bridge.org/bridge01/?action=display&bridge=ReutersBridge&feed=home%2Ftopnews&format=Mrss",
            },
        ],
        picsCacheDir: `${CACHE_DIR}/news/pics`,
    },
    path: {
        cacheDir: CACHE_DIR,
        storageDir: `${HOME}/.config/${SHELL_NAME}`,
        autoPaletteCli: `${RICE_HOME}/auto-palette-cli`,
        bottlesCli: "bottles-cli",
        magick: "magick",
        mpc: "mpc",
        python: `${SRC}/.venv/bin/python`,
        xdgOpen: "xdg-open",
        yaml2json: "yaml2json",
    },
    updates: {
        checkUpdatesCommand: `/bin/bash -c "(checkupdates; yay -Qum 2>/dev/null); exit 0"`,
        checkUpdatesInterval: 300_000,
        launchCommand:
            'xdg-terminal-exec -- /bin/bash -c "yay -Syu; read -n 1 -s -r -p \\"Press any key to continue\\""',
    },
    weather: {
        dataProvider: loadMeteoAMWeatherData,
        updateInterval: 300_000,
    },
    workspaceSwitcher: {},
};

export default config;
