import { Gtk } from "ags/gtk4";
import AstalNotifd from "gi://AstalNotifd?version=0.1";
import { createBinding, createState } from "gnim";
import { timeout, Timer } from "ags/time";
import app from "ags/gtk4/app";
import AstalApps from "gi://AstalApps?version=0.1";

export const notifd = AstalNotifd.get_default();

let notifsPopupLocked = false;

export function lockNotifsPopup() {
    notifsPopupLocked = true;
    setPopupNotifs([]);
}

export function unlockNotifsPopup() {
    notifsPopupLocked = false;
}

let latestNotificationTimestamp = Date.now();

const [popupNotifs, setPopupNotifs] = createState<AstalNotifd.Notification[]>([]);
export { popupNotifs as notifsToShow };

export const notifications = createBinding(notifd, "notifications").as((ns) => ns.sort((a, b) => b.time - a.time));

function handleNewNotifications() {
    const notifs = notifications.get();
    if (!notifs.length) return;

    if (notifsPopupLocked) {
        latestNotificationTimestamp = notifs[0].time;
        return;
    }

    const newNotifs = [];
    for (const notif of notifs) {
        if (notif.time <= latestNotificationTimestamp) break;
        newNotifs.push(notif);
    }

    latestNotificationTimestamp = notifs[0].time;

    for (const notif of newNotifs) {
        if (notif.soundFile) {
            Gtk.MediaFile.new_for_filename(notif.soundFile).play();
        } else if (!notif.suppressSound) {
            // DEFAULT_NOTIFICATION_SOUND.play();
        }
    }

    setPopupNotifs([...popupNotifs.get(), ...newNotifs]);
}

notifications.subscribe(handleNewNotifications);
handleNewNotifications();

let showTimer: Timer | undefined;
let hideTimer: Timer | undefined;

export function dismissNewNotificationWindow() {
    const window = app.get_window("new-notification");
    if (!window) return;

    hideTimer?.cancel();
    hideTimer = undefined;

    showTimer?.cancel();
    showTimer = undefined;

    window.hide();
    hideTimer = timeout(300, () => {
        const newNotifs = popupNotifs.get().slice(1);
        setPopupNotifs(newNotifs);
        if (newNotifs.length) {
            window.show();
            showNewNotificationWindow();
        }
    });
}

function showNewNotificationWindow() {
    const window = app.get_window("new-notification")!;
    if (window.visible) return;
    window.show();
    showTimer = timeout(5000, dismissNewNotificationWindow);
}

popupNotifs.subscribe(() => {
    showNewNotificationWindow();
});

const apps = new AstalApps.Apps();
apps.entryMultiplier = 10;

export function guessNotificationApp(notification: AstalNotifd.Notification) {
    return notification.desktopEntry
        ? apps.exact_query(notification.desktopEntry)[0]
        : apps.exact_query(notification.appName)[0];
}
