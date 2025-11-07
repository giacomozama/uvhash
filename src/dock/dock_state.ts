import AstalApps from "gi://AstalApps?version=0.1";
import { DockItem } from "./types";
import config from "../config";
import { notifications } from "../notifications/notifications_state";

const apps = new AstalApps.Apps();

export const dockItems: DockItem[] = config.dock.items.map((item) => {
    const app = item.query ? apps.exact_query(item.query)[0] : undefined;
    const icon = item.iconName ?? app?.get_icon_name();
    return { app, iconName: icon!, feature: item.feature, tooltip: item.tooltip };
});

export const appNotificationCounts = notifications.as((notifs) => {
    const result = new Map<string, number>();
    for (const notif of notifs) {
        result.set(notif.desktopEntry, (result.get(notif.desktopEntry) ?? 0) + 1);
    }
    return result;
});
