import { Gtk } from "ags/gtk4";
import AstalNotifd from "gi://AstalNotifd?version=0.1";
import Pango from "gi://Pango?version=1.0";
import { popdownParentMenuButton } from "../utils/gtk";
import { CURSOR_POINTER } from "../utils/gtk";
import { guessNotificationApp } from "../notifications/notifications_state";

const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    second: "2-digit",
};

function formatNotificationDate(notification: AstalNotifd.Notification) {
    return new Date(notification.time * 1000).toLocaleString("default", TIME_FORMAT_OPTIONS);
}

function getNotificationIconName(notification: AstalNotifd.Notification) {
    return notification.appIcon || guessNotificationApp(notification)?.iconName || "notification-symbolic";
}

export function NotificationItem({
    notification,
    onDismiss,
}: {
    notification: AstalNotifd.Notification;
    onDismiss?: () => void;
}) {
    return (
        <box cssClasses={["notif-bar-item"]} orientation={Gtk.Orientation.HORIZONTAL} valign={Gtk.Align.START}>
            <image
                iconName={getNotificationIconName(notification)}
                valign={Gtk.Align.START}
                marginTop={4}
                pixelSize={26}
            />
            <box cssClasses={["notif-bar-item-text"]} orientation={Gtk.Orientation.VERTICAL} vexpand={true}>
                <box orientation={Gtk.Orientation.VERTICAL}>
                    <box orientation={Gtk.Orientation.HORIZONTAL} hexpand={true}>
                        <label
                            label={notification.summary}
                            cssClasses={["title"]}
                            xalign={Gtk.Align.START}
                            halign={Gtk.Align.START}
                            hexpand={true}
                            ellipsize={Pango.EllipsizeMode.END}
                        />
                        <label label={formatNotificationDate(notification)} cssClasses={["date"]} />
                    </box>
                    <label
                        label={notification.body}
                        cssClasses={["body"]}
                        xalign={Gtk.Align.START}
                        halign={Gtk.Align.START}
                        wrap={true}
                        maxWidthChars={0}
                        wrapMode={Pango.WrapMode.WORD_CHAR}
                        ellipsize={Pango.EllipsizeMode.END}
                        lines={4}
                    />
                    <Gtk.GestureSingle
                        button={1}
                        onBegin={(source) => {
                            const defaultAction = notification.actions.find((a) => a.id === "default");
                            if (defaultAction) {
                                notification.invoke(defaultAction.id);
                                popdownParentMenuButton(source.widget);
                            }
                        }}
                    />
                </box>
                <box orientation={Gtk.Orientation.HORIZONTAL} hexpand={true} cssClasses={["actions"]}>
                    <box
                        orientation={Gtk.Orientation.HORIZONTAL}
                        hexpand={true}
                        spacing={4}
                        cssClasses={["actions"]}
                        halign={Gtk.Align.START}
                    >
                        {notification.actions
                            .filter((a) => a.id !== "default" && a.label)
                            .map((action) => (
                                <button
                                    label={action.label}
                                    cssClasses={["action-button"]}
                                    cursor={CURSOR_POINTER}
                                    onClicked={(self) => {
                                        notification.invoke(action.id);
                                        popdownParentMenuButton(self);
                                    }}
                                >
                                    {notification.actionIcons ? (
                                        <image iconName={action.id} cssClasses={["action-icon"]} />
                                    ) : (
                                        <label label={action.label} />
                                    )}
                                </button>
                            ))}
                    </box>
                    <button
                        label="Dismiss"
                        cssClasses={["dismiss-button", "action-button"]}
                        halign={Gtk.Align.END}
                        cursor={CURSOR_POINTER}
                        onClicked={() => {
                            notification.dismiss();
                            onDismiss?.();
                        }}
                    />
                </box>
            </box>
        </box>
    );
}
