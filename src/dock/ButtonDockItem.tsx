import { Gtk } from "ags/gtk4";
import { Accessor } from "gnim";
import { DockItem, DockItemFeature } from "./types";
import MusicLibraryDockItem from "../mpd/MusicLibraryDockItem";
import { DefaultButtonDockItem } from "../dock/DefaultButtonDockItem";
import { dockState } from "./dock_state";
import { GameLauncherDockItem } from "../game_launcher/GameLauncherPopover";

function ButtonDockItemContent({ item }: { item: DockItem }) {
    switch (item.feature) {
        case DockItemFeature.GameLauncher:
            return (
                <GameLauncherDockItem iconName={item.iconName} tooltip={item.tooltip ?? "Games"} />
            );
        case DockItemFeature.MpdClient:
            return <MusicLibraryDockItem iconName={item.iconName} />;
        default:
            return <DefaultButtonDockItem item={item} />;
    }
}

export function ButtonDockItem({ item }: { item: DockItem }) {
    const entryWithoutSuffix = item.app?.get_name().slice(0, -8);
    const notificationCount = entryWithoutSuffix
        ? dockState().appNotificationCounts.as((an) => an.get(entryWithoutSuffix) ?? 0)
        : undefined;

    return (
        <box layoutManager={new Gtk.BinLayout()} valign={Gtk.Align.CENTER}>
            <ButtonDockItemContent item={item} />
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
