import { Gtk } from "ags/gtk4";
import { NotificationItem } from "./NotificationItem";
import { popdownParentMenuButton } from "../utils/gtk";
import { CURSOR_POINTER } from "../utils/gtk";
import { lockNotifsPopup, notifd, notifications, unlockNotifsPopup } from "../notifications/notifications_state";
import { With } from "gnim";

export function NotificationsBarPopover() {
    return (
        <glassypopover widthRequest={500} onShow={() => lockNotifsPopup()} onHide={() => unlockNotifsPopup()}>
            <box orientation={Gtk.Orientation.VERTICAL} cssClasses={["popover-standard-inner"]}>
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]}>
                    <image iconName="notification-symbolic" halign={Gtk.Align.START} />
                    <label label="Notifications" xalign={0} hexpand={true} />
                    <button
                        cursor={CURSOR_POINTER}
                        sensitive={notifications.as((ns) => ns.length > 0)}
                        valign={Gtk.Align.CENTER}
                        onClicked={(self) => {
                            notifd.notifications.forEach((n) => n.dismiss());
                            popdownParentMenuButton(self);
                        }}
                    >
                        <box spacing={12}>
                            <image iconName="edit-delete-symbolic" />
                            <label label="Dismiss all" />
                        </box>
                    </button>
                </box>
                <scrolledwindow
                    hexpand={true}
                    minContentWidth={500}
                    maxContentWidth={500}
                    minContentHeight={650}
                    maxContentHeight={650}
                >
                    <With value={notifications}>
                        {(notifications) =>
                            notifications.length === 0 ? (
                                <box
                                    vexpand={true}
                                    hexpand={true}
                                    class="popover-message"
                                    orientation={Gtk.Orientation.VERTICAL}
                                    valign={Gtk.Align.CENTER}
                                    spacing={12}
                                >
                                    <label label="No notifications" hexpand={true} xalign={0.5} />
                                </box>
                            ) : (
                                <box
                                    orientation={Gtk.Orientation.VERTICAL}
                                    cssClasses={["notif-bar-items"]}
                                    valign={Gtk.Align.START}
                                >
                                    {notifications.map((notification) => (
                                        <NotificationItem notification={notification} />
                                    ))}
                                </box>
                            )
                        }
                    </With>
                </scrolledwindow>
            </box>
        </glassypopover>
    );
}
