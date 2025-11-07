import { Astal, Gdk, Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { CURSOR_POINTER } from "../utils/gtk";
import { execAsync } from "ags/process";
import { firstNonFullscreenMonitor } from "../utils/monitors";
import { createRoot } from "gnim";
import config from "../config";

function ShutdownButton({ iconName, label, onClicked }: { iconName: string; label: string; onClicked: () => void }) {
    return (
        <button onClicked={onClicked} cursor={CURSOR_POINTER} class="shutdown-button">
            <box vexpand={true} hexpand={true}>
                <box orientation={Gtk.Orientation.VERTICAL} hexpand={true} valign={Gtk.Align.CENTER}>
                    <image iconName={iconName} pixelSize={48} />
                    <label label={label} />
                </box>
            </box>
        </button>
    );
}

function ClickToCloseArea() {
    return (
        <box hexpand={true} vexpand={true}>
            <Gtk.GestureSingle
                button={1}
                onBegin={() => {
                    app.get_window("shutdown")?.hide();
                }}
            />
        </box>
    );
}

export default function ShutdownWindow() {
    return createRoot(
        (dispose) =>
            (
                <window
                    name="shutdown"
                    class="Shutdown"
                    layer={Astal.Layer.OVERLAY}
                    gdkmonitor={firstNonFullscreenMonitor.as((m) => m.gdkMonitor)}
                    keymode={Astal.Keymode.EXCLUSIVE}
                    exclusivity={Astal.Exclusivity.IGNORE}
                    anchor={
                        Astal.WindowAnchor.TOP |
                        Astal.WindowAnchor.RIGHT |
                        Astal.WindowAnchor.BOTTOM |
                        Astal.WindowAnchor.LEFT
                    }
                    onUnmap={(self) => {
                        dispose();
                        self.destroy();
                    }}
                    application={app}
                    namespace={config.shellName}
                >
                    <Gtk.EventControllerKey
                        onKeyPressed={(_, key) => {
                            if (key === Gdk.KEY_Escape) {
                                app.get_window("shutdown")?.hide();
                            }
                        }}
                    />
                    <box>
                        <ClickToCloseArea />
                        <box orientation={Gtk.Orientation.VERTICAL} halign={Gtk.Align.CENTER} hexpand={false} vexpand={false}>
                            <ClickToCloseArea />
                            <box
                                cssClasses={["session-buttons-container"]}
                                orientation={Gtk.Orientation.VERTICAL}
                                vexpand={false}
                                halign={Gtk.Align.CENTER}
                                valign={Gtk.Align.CENTER}
                                spacing={12}
                            >
                                <box spacing={12}>
                                    <ShutdownButton
                                        iconName="exit-symbolic"
                                        label="Cancel"
                                        onClicked={() => app.get_window("shutdown")?.hide()}
                                    />
                                    <ShutdownButton
                                        iconName="system-lock-screen-symbolic"
                                        label="Lock"
                                        onClicked={() => {
                                            app.get_window("shutdown")?.hide();
                                            execAsync(`/bin/bash -c "pidof hyprlock || hyprlock"`);
                                        }}
                                    />
                                    <ShutdownButton
                                        iconName="system-log-out-symbolic"
                                        label="Logout"
                                        onClicked={() => execAsync("hyprctl dispatch exit")}
                                    />
                                </box>
                                <box spacing={12}>
                                    <ShutdownButton
                                        iconName="system-suspend-symbolic"
                                        label="Suspend"
                                        onClicked={() => {
                                            app.get_window("shutdown")?.hide();
                                            execAsync("systemctl suspend");
                                        }}
                                    />
                                    <ShutdownButton
                                        iconName="system-restart-symbolic"
                                        label="Restart"
                                        onClicked={() => execAsync("shutdown -r now")}
                                    />
                                    <ShutdownButton
                                        iconName="system-shutdown-symbolic"
                                        label="Shutdown"
                                        onClicked={() => execAsync("shutdown now")}
                                    />
                                </box>
                            </box>
                            <ClickToCloseArea />
                        </box>
                        <ClickToCloseArea />
                    </box>
                </window>
            ) as Gtk.Window
    );
}
