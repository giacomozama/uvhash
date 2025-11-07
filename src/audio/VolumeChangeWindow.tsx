import { Astal, Gtk } from "ags/gtk4";
import { firstNonFullscreenMonitor } from "../utils/monitors";
import { createRoot } from "gnim";
import app from "ags/gtk4/app";
import { audioOutputState, volumeIconName } from "./audio_state";
import config from "../config";

export function VolumeChangeWindow() {
    return createRoot(
        (dispose) =>
            (
                <window
                    name="volume-change"
                    gdkmonitor={firstNonFullscreenMonitor.as((m) => m.gdkMonitor)}
                    exclusivity={Astal.Exclusivity.IGNORE}
                    anchor={Astal.WindowAnchor.TOP}
                    cssClasses={["VolumeChange", "popover-standard-dark"]}
                    marginTop={240}
                    layer={Astal.Layer.OVERLAY}
                    halign={Gtk.Align.CENTER}
                    application={app}
                    overflow={Gtk.Overflow.HIDDEN}
                    onDestroy={dispose}
                    namespace={`${config.shellName}-overlay`}
                >
                    <box cssName="main-inner" vexpand={true} hexpand={true}>
                        <box
                            cssClasses={["current-volume"]}
                            orientation={Gtk.Orientation.HORIZONTAL}
                            hexpand={true}
                            halign={Gtk.Align.CENTER}
                            valign={Gtk.Align.CENTER}
                        >
                            <image iconName={volumeIconName} />
                            <label label="Volume:" />
                            <label
                                cssClasses={["volume"]}
                                label={audioOutputState.volume.as((v) => `${(v * 100).toFixed(0)}%`)}
                                xalign={1}
                            />
                        </box>
                    </box>
                </window>
            ) as Gtk.Window
    );
}
