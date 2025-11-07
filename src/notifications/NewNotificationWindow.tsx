import { createRoot, With } from "gnim";
import { firstNonFullscreenMonitor } from "../utils/monitors";
import { Astal, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { dismissNewNotificationWindow, notifsToShow } from "../notifications/notifications_state";
import { NotificationItem } from "./NotificationItem";
import config from "../config";

export function NewNotificationWindow() {
    return createRoot(
        (dispose) =>
            (
                <window
                    name="new-notification"
                    cssClasses={["NewNotification"]}
                    gdkmonitor={firstNonFullscreenMonitor.as((m) => m.gdkMonitor)}
                    marginTop={44}
                    widthRequest={500}
                    defaultWidth={500}
                    exclusivity={Astal.Exclusivity.IGNORE}
                    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
                    application={app}
                    onDestroy={dispose}
                    namespace={`${config.shellName}-overlay`}
                >
                    <box widthRequest={500} >
                        <With value={notifsToShow}>
                            {(notifs) =>
                                notifs.length !== 0 && (
                                    <NotificationItem
                                        notification={notifs[0]}
                                        onDismiss={dismissNewNotificationWindow}
                                    />
                                )
                            }
                        </With>
                    </box>
                </window>
            ) as Gtk.Window
    );
}
