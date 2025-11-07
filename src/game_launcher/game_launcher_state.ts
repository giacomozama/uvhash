import AstalApps from "gi://AstalApps?version=0.1";
import { GameLauncherEntry } from "./types";
import config from "../config";
import { steamEntries } from "./steam";
import { bottlesEntries } from "./bottles";

interface GameLauncherListEntry {
    id: string;
    iconName: string;
    app: AstalApps.Application;
    entries: GameLauncherEntry[];
}

const astalApps = new AstalApps.Apps();

const enabledLaunchers = Object.keys(config.gameLaunchers);

export const launchers: GameLauncherListEntry[] = [];

if (enabledLaunchers.includes("steam")) {
    const app = astalApps.exact_query("steam")[0];
    launchers.push({
        id: "steam",
        iconName: app.iconName,
        app,
        entries: steamEntries,
    });
}

if (enabledLaunchers.includes("bottles")) {
    const app = astalApps.exact_query("bottles")[0];
    launchers.push({
        id: "bottles",
        iconName: app.iconName,
        app,
        entries: bottlesEntries,
    });
}
