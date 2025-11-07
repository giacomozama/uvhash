import AstalApps from "gi://AstalApps?version=0.1";

export enum DockItemFeature {
    BottlesLauncher,
    SteamLauncher,
    GameLauncher,
    MpdClient,
}

export type DockItemQuery = { query?: string; iconName?: string; feature?: DockItemFeature; tooltip?: string };

export type DockItem = { app?: AstalApps.Application; iconName: string; feature?: DockItemFeature; tooltip?: string };
