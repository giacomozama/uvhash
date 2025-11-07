import { Gtk } from "ags/gtk4";
import { Accessor } from "gnim";
import { Monitor } from "../utils/monitors";
import { DockItem, DockItemFeature } from "./types";
import MusicLibraryDockItem from "../mpd/MusicLibraryDockItem";
import { DefaultButtonDockItem } from "../dock/DefaultButtonDockItem";
import {
    BottlesGameLauncherPopover,
    GameLauncherDockItem,
    SteamGameLauncherPopover,
} from "../game_launcher/GameLauncherPopover";
import { appNotificationCounts } from "./dock_state";

function ButtonDockItemContent({ item, monitor }: { item: DockItem; monitor: Monitor }) {
    switch (item.feature) {
        case DockItemFeature.BottlesLauncher:
            const bottlesPopover = (<BottlesGameLauncherPopover item={item} monitor={monitor} />) as Gtk.Popover;
            return <DefaultButtonDockItem item={item} monitor={monitor} leftClickPopover={bottlesPopover} />;
        case DockItemFeature.SteamLauncher:
            const steamPopover = (<SteamGameLauncherPopover item={item} monitor={monitor} />) as Gtk.Popover;
            return <DefaultButtonDockItem item={item} monitor={monitor} leftClickPopover={steamPopover} />;
        case DockItemFeature.GameLauncher:
            return (
                <GameLauncherDockItem iconName={item.iconName} tooltip={item.tooltip ?? "Games"} monitor={monitor} />
            );
        case DockItemFeature.MpdClient:
            return <MusicLibraryDockItem iconName={item.iconName} />;
        default:
            return <DefaultButtonDockItem item={item} monitor={monitor} />;
    }
}

export function ButtonDockItem({ item, monitor }: { item: DockItem; monitor: Monitor }) {
    const entryWithoutSuffix = item.app?.entry.slice(0, -8);
    const notificationCount = entryWithoutSuffix
        ? appNotificationCounts.as((an) => an.get(entryWithoutSuffix) ?? 0)
        : undefined;

    return (
        <box layoutManager={new Gtk.BinLayout()} valign={Gtk.Align.CENTER}>
            <ButtonDockItemContent item={item} monitor={monitor} />
            {notificationCount && (
                <label
                    cssClasses={["notif-count"]}
                    label={notificationCount.as((c) => `${c > 99 ? "99+" : c}`)}
                    visible={notificationCount.as((c) => c > 0)}
                    valign={Gtk.Align.END}
                    halign={Gtk.Align.END}
                />
            )}
        </box>
    );
}
