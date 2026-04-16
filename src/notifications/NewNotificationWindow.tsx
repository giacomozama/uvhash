import { createRoot, With } from "gnim";
import { firstNonFullscreenMonitor } from "../compositor/compositor";
import { Astal, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { notificationsState } from "../notifications/notifications_state";
import { NotificationItem } from "./NotificationItem";
import config from "../config";

export function NewNotificationWindow() {
    return createRoot(
        (dispose) =>
            (
                <window
                    name="new-notification"
                    cssClasses={["NewNotification"]}
                    gdkmonitor={firstNonFullscreenMonitor}
                    marginTop={44}
                    widthRequest={500}
                    defaultWidth={500}
                    exclusivity={Astal.Exclusivity.IGNORE}
                    anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
                    application={app}
                    onCloseRequest={(self) => {
                        dispose();
                        self.destroy();
                    }}
                    namespace={`${config.shellName}-overlay`}
                >
                    <box widthRequest={500}>
                        <With value={notificationsState().popupNotifs}>
                            {(notifs) =>
                                notifs.length !== 0 && (
                                    <NotificationItem
                                        notification={notifs[0]}
                                        onDismiss={notificationsState().dismissNewNotificationWindow}
                                    />
                                )
                            }
                        </With>
                    </box>
                </window>
            ) as Gtk.Window
    );
}
